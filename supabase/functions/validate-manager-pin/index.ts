import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

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

    const { user_id, pin } = await req.json();

    if (!user_id || !pin) {
      throw new Error('Missing user_id or pin');
    }

    // Get user's role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role, employee_id')
      .eq('user_id', user_id)
      .in('role', ['admin', 'manager'])
      .single();

    if (roleError || !userRole) {
      return new Response(
        JSON.stringify({ valid: false, error: 'User does not have manager/admin role' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Get employee PIN (hashed)
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('pin')
      .eq('id', userRole.employee_id)
      .single();

    if (empError || !employee) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Employee record not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Verify PIN
    const isValid = await bcrypt.compare(pin, employee.pin);

    return new Response(
      JSON.stringify({ valid: isValid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('PIN validation error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
