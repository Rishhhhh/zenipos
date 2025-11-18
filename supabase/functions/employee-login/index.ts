import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

// Hash password using Web Crypto API (compatible with Deno edge runtime)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { pin, organizationId, branchId } = await req.json();

    // Validate required inputs
    if (!pin || typeof pin !== 'string' || pin.length !== 5) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid PIN format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!organizationId) {
      console.error('Missing organizationId in request');
      return new Response(
        JSON.stringify({ success: false, error: 'Organization ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!branchId) {
      console.error('Missing branchId in request');
      return new Response(
        JSON.stringify({ success: false, error: 'Branch ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verify organization exists and is active
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, is_active, name')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Organization lookup error:', orgError);
      return new Response(
        JSON.stringify({ success: false, error: 'Organization not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    if (!org || !org.is_active) {
      console.error('Organization inactive or not found:', organizationId);
      return new Response(
        JSON.stringify({ success: false, error: 'Organization is not active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Verify branch exists and belongs to organization
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id, organization_id, name, active')
      .eq('id', branchId)
      .single();

    if (branchError || !branch) {
      console.error('Branch not found:', branchId);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid branch' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (branch.organization_id !== organizationId) {
      console.error('Branch does not belong to organization');
      return new Response(
        JSON.stringify({ success: false, error: 'Branch access denied' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    if (!branch.active) {
      console.error('Branch is inactive:', branchId);
      return new Response(
        JSON.stringify({ success: false, error: 'Branch is inactive' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log(`Branch validated: ${branch.name} (${branchId})`);

    // Get employees ONLY from selected branch
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, name, email, pin, role, branch_id, auth_user_id')
      .eq('branch_id', branchId)
      .eq('active', true);

    console.log(`Found ${employees?.length || 0} active employees in branch ${branch.name}`);

    if (fetchError) {
      console.error('Employee lookup error:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to retrieve employees' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Check PIN against each employee
    for (const employee of employees || []) {
      try {
        const pinHash = await hashPassword(pin);
        const isValid = pinHash === employee.pin;
        
        if (isValid) {
          // Create or get auth user for this employee
          let authUserId = employee.auth_user_id;
          
          if (!authUserId) {
            // Create auth user for employee (first-time setup)
            const email = employee.email || `employee-${employee.id}@pos.internal`;
            const tempPassword = crypto.randomUUID(); // Random password for internal employees
            const { data: authData, error: createError } = await supabase.auth.admin.createUser({
              email,
              password: tempPassword,
              email_confirm: true,
              user_metadata: {
                employee_id: employee.id,
                name: employee.name,
                role: employee.role
              }
            });

            if (createError) {
              console.error('Failed to create auth user:', createError);
              return new Response(
                JSON.stringify({ success: false, error: 'Authentication setup failed' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
              );
            }

            authUserId = authData.user.id;

            // Link employee to auth user
            await supabase
              .from('employees')
              .update({ auth_user_id: authUserId })
              .eq('id', employee.id);

            // Create user_role entry
            await supabase
              .from('user_roles')
              .upsert({ 
                user_id: authUserId, 
                role: employee.role,
                employee_id: employee.id
              });
          }

          // Generate session using admin API (bypass password requirement)
          const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: employee.email || `employee-${employee.id}@pos.internal`,
            options: {
              redirectTo: `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify`
            }
          });

          if (sessionError) {
            console.error('Session generation error:', sessionError);
            return new Response(
              JSON.stringify({ success: false, error: 'Authentication failed' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
          }

          // Remove PIN from response
          const { pin: _, ...employeeData } = employee;
          
          console.log(`Employee ${employee.name} successfully logged in to branch ${branch.name} of organization ${org.name}`);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              employee: employeeData,
              organizationId: organizationId,
              branchId: branch.id,
              branchName: branch.name,
              authUserId: authUserId,
              setupToken: sessionData?.properties?.action_link
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (error) {
        console.error('PIN comparison error for employee:', employee.id, error);
        continue;
      }
    }

    // No match found - PIN invalid for this organization
    console.error(`Invalid PIN attempt for organization ${org.name}`);
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid PIN for this organization' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Login failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
