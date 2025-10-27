import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { checkRateLimit, rateLimitResponse } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check rate limit - strict for login attempts
  const rateLimit = await checkRateLimit(req, 'employee-login');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { pin } = await req.json();

    if (!pin || typeof pin !== 'string' || pin.length !== 5) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid PIN format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get all active employees
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, name, email, pin, role, branch_id, auth_user_id')
      .eq('active', true);

    if (fetchError) {
      console.error('Database error:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
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
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              employee: employeeData,
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

    // No match found
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid PIN' }),
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
