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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { organizationId, settings } = await req.json();

    if (!organizationId) {
      throw new Error('Missing organizationId');
    }

    // Get organization first
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check if user is the organization owner OR has admin/owner role via employees
    const isOwner = org.owner_id === user.id;
    
    let hasAdminRole = false;
    if (!isOwner) {
      const { data: employee } = await supabase
        .from('employees')
        .select('role')
        .eq('auth_user_id', user.id)
        .eq('organization_id', organizationId)
        .in('role', ['owner', 'admin'])
        .maybeSingle();
      
      hasAdminRole = !!employee;
    }

    if (!isOwner && !hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Only owners or admins can update organization settings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    let updateData: any = {};

    // Handle password change separately
    if (settings.currentPassword && settings.newPassword) {
      // Verify current password
      const isValid = await bcrypt.compare(settings.currentPassword, org.login_password_hash);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Current password is incorrect' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(settings.newPassword);
      updateData.login_password_hash = hashedPassword;

      // Remove password fields from settings
      delete settings.currentPassword;
      delete settings.newPassword;
    }

    // Update other settings
    if (settings.name) updateData.name = settings.name;
    if (settings.phone) updateData.phone = settings.phone;
    if (settings.address) updateData.address = settings.address;
    if (settings.businessType) updateData.business_type = settings.businessType;
    if (settings.primaryColor) updateData.primary_color = settings.primaryColor;
    if (settings.accentColor) updateData.accent_color = settings.accentColor;
    if (settings.logoUrl) updateData.logo_url = settings.logoUrl;

    // Update organization
    const { data: updated, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log to audit_log
    await supabase.from('audit_log').insert({
      actor: user.id,
      action: 'organization_settings_updated',
      entity: 'organizations',
      entity_id: organizationId,
      diff: {
        before: org,
        after: updated,
        changed_fields: Object.keys(updateData),
      },
    });

    // Return updated org (without password hash)
    const { login_password_hash, ...safeOrg } = updated;

    return new Response(
      JSON.stringify({ organization: safeOrg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Organization settings update error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
