import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { pin, organizationId, branchId } = await req.json();
    
    console.log('Clock-in validation attempt:', { organizationId, branchId, pinLength: pin?.length });
    
    if (!pin) {
      throw new Error('PIN is required');
    }

    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const hashedPin = await hashPassword(pin);
    console.log('Looking for employee with hashed PIN');

    // Query for employee with matching PIN in the organization
    let query = supabaseAdmin
      .from('employees')
      .select('*')
      .eq('pin', hashedPin)
      .eq('organization_id', organizationId)
      .eq('active', true);

    // If branchId is provided, filter by branch
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data: employees, error: employeeError } = await query;

    if (employeeError) {
      console.error('Database error:', employeeError);
      throw new Error('Failed to validate employee');
    }

    if (!employees || employees.length === 0) {
      console.log('No employee found with provided PIN');
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid PIN' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const employee = employees[0];
    console.log('Employee found:', { id: employee.id, name: employee.name, role: employee.role });

    // Check for active shift
    const { data: activeShift } = await supabaseAdmin.rpc('get_active_shift', {
      employee_id_param: employee.id
    });

    if (activeShift) {
      console.log('Employee already has active shift');
      return new Response(
        JSON.stringify({ valid: false, error: 'Employee already has an active shift' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('Validation successful');
    
    return new Response(
      JSON.stringify({ 
        valid: true, 
        employee: {
          id: employee.id,
          name: employee.name,
          role: employee.role,
          organization_id: employee.organization_id,
          branch_id: employee.branch_id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
