import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

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

    const { pin, organizationId } = await req.json();

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

    // Get all active branches for the organization
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('active', true);

    if (branchError) {
      console.error('Branch lookup error:', branchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to retrieve branches' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!branches || branches.length === 0) {
      console.error('No active branches found for organization:', organizationId);
      return new Response(
        JSON.stringify({ success: false, error: 'No active branches found for this organization' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const branchIds = branches.map(b => b.id);
    console.log(`Organization ${org.name} has ${branchIds.length} active branches`);

    // Get employees only from organization's branches
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, name, email, pin, role, branch_id, auth_user_id')
      .in('branch_id', branchIds)
      .eq('active', true);

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
        const isValid = await bcrypt.compare(pin, employee.pin);
        
        if (isValid) {
          // Create or get auth user for this employee
          let authUserId = employee.auth_user_id;
          
          if (!authUserId) {
            // Create auth user for employee (first-time setup)
            const email = employee.email || `employee-${employee.id}@pos.internal`;
            const { data: authData, error: createError } = await supabase.auth.admin.createUser({
              email,
              password: pin,
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
                role: employee.role 
              });
          }

          // Sign in with Supabase Auth to get proper session
          const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
            email: employee.email || `employee-${employee.id}@pos.internal`,
            password: pin
          });

          if (signInError) {
            console.error('Sign in error:', signInError);
            return new Response(
              JSON.stringify({ success: false, error: 'Authentication failed' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
          }

          // Remove PIN from response
          const { pin: _, ...employeeData } = employee;
          
          console.log(`Employee ${employee.name} successfully logged in to organization ${org.name}`);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              employee: employeeData,
              organizationId: organizationId,
              session: sessionData.session,
              user: sessionData.user
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
