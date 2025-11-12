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

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        owner_id,
        is_active,
        created_at,
        logo_url,
        primary_color,
        phone,
        address
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: organizations, error: orgError, count } = await query;

    if (orgError) throw orgError;

    // Fetch additional stats for each organization
    const enrichedOrgs = await Promise.all(
      (organizations || []).map(async (org) => {
        // Count branches
        const { count: branchCount } = await supabase
          .from('branches')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('active', true);

        // Count orders today
        const { count: ordersToday } = await supabase
          .from('orders')
          .select('*, branches!inner(organization_id)', { count: 'exact', head: true })
          .eq('branches.organization_id', org.id)
          .gte('created_at', new Date().toISOString().split('T')[0]);

        // Sum revenue today
        const { data: revenueData } = await supabase
          .from('orders')
          .select('total, branches!inner(organization_id)')
          .eq('branches.organization_id', org.id)
          .gte('created_at', new Date().toISOString().split('T')[0]);

        const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

        return {
          ...org,
          active_branches: branchCount || 0,
          total_orders_today: ordersToday || 0,
          total_revenue_today: totalRevenue,
        };
      })
    );

    return new Response(
      JSON.stringify({
        organizations: enrichedOrgs,
        total: count || 0,
        page,
        limit,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in super-admin-organizations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
