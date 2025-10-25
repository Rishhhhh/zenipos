import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const alerts: any[] = [];

    // 1. Check low stock items
    const { data: lowStock } = await supabase
      .from('inventory_items')
      .select('*, branches(name)')
      .lte('current_qty', 10);

    if (lowStock && lowStock.length > 0) {
      const branchMap = new Map();
      for (const item of lowStock) {
        const branchId = item.branch_id || 'default';
        if (!branchMap.has(branchId)) {
          branchMap.set(branchId, []);
        }
        branchMap.get(branchId).push(item);
      }

      for (const [branchId, items] of branchMap) {
        alerts.push({
          type: 'low_stock',
          branch_id: branchId,
          severity: 'warning',
          message: `${items.length} items low on stock`,
          data: items
        });
      }
    }

    // 2. Check offline devices
    const { data: devices } = await supabase
      .from('devices')
      .select('*, branches(name)')
      .lt('last_seen', new Date(Date.now() - 30 * 60 * 1000).toISOString());

    if (devices && devices.length > 0) {
      for (const device of devices) {
        alerts.push({
          type: 'offline_device',
          branch_id: device.branch_id,
          severity: 'error',
          message: `Device ${device.name} offline`,
          data: device
        });
      }
    }

    // 3. Check sales milestones
    const { data: branches } = await supabase
      .from('branches')
      .select('*')
      .eq('active', true);

    for (const branch of branches || []) {
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('branch_id', branch.id)
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const revenue = todayOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

      const milestones = [5000, 10000, 25000, 50000];
      const settings = branch.settings as any || {};
      const lastMilestone = settings.last_milestone || 0;

      for (const milestone of milestones) {
        if (revenue >= milestone && lastMilestone < milestone) {
          alerts.push({
            type: 'sales_milestone',
            branch_id: branch.id,
            severity: 'success',
            message: `Branch ${branch.name} hit RM ${milestone} today!`,
            data: { revenue, milestone }
          });

          await supabase
            .from('branches')
            .update({
              settings: { ...settings, last_milestone: milestone }
            })
            .eq('id', branch.id);
        }
      }
    }

    // 4. Send push notifications for critical alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'error');

    if (criticalAlerts.length > 0) {
      for (const alert of criticalAlerts) {
        const { data: users } = await supabase
          .from('user_branches')
          .select('user_id')
          .eq('branch_id', alert.branch_id);

        if (users && users.length > 0) {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              user_ids: users.map(u => u.user_id),
              notification_type: alert.type,
              message: {
                title: alert.severity.toUpperCase(),
                body: alert.message,
                icon: '/placeholder.svg',
                data: alert.data,
                requireInteraction: true
              }
            }
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ alerts, sent: criticalAlerts.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Branch alerts error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
