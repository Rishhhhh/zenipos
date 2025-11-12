import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify super admin role
    const { data: hasRole, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'super_admin'
    });

    if (roleError || !hasRole) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Super admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { action, organizationId, reason } = await req.json();

    if (action === 'start') {
      // Check if already impersonating
      const { data: existing } = await supabase
        .from('super_admin_impersonations')
        .select('id')
        .eq('super_admin_user_id', user.id)
        .is('ended_at', null)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Already impersonating another organization' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      if (!organizationId || !reason) {
        return new Response(
          JSON.stringify({ error: 'Missing organizationId or reason' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Create impersonation session
      const { data, error } = await supabase
        .from('super_admin_impersonations')
        .insert({
          super_admin_user_id: user.id,
          organization_id: organizationId,
          reason,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent'),
        })
        .select()
        .single();

      if (error) throw error;

      // Audit log
      await supabase.from('audit_log').insert({
        actor: user.id,
        action: 'super_admin_impersonation_started',
        entity: 'organizations',
        entity_id: organizationId,
        diff: { reason },
      });

      console.log(`Super admin ${user.id} started impersonating organization ${organizationId}`);

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'end') {
      // End active impersonation
      const { data, error } = await supabase
        .from('super_admin_impersonations')
        .update({ ended_at: new Date().toISOString() })
        .eq('super_admin_user_id', user.id)
        .is('ended_at', null)
        .select()
        .single();

      if (error) throw error;

      // Audit log
      await supabase.from('audit_log').insert({
        actor: user.id,
        action: 'super_admin_impersonation_ended',
        entity: 'organizations',
        entity_id: data.organization_id,
      });

      console.log(`Super admin ${user.id} ended impersonation of organization ${data.organization_id}`);

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "start" or "end"' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error: any) {
    console.error('Error in super-admin-impersonate:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
