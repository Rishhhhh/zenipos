import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { getBusinessContext } from '../_shared/businessContext.ts';

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

    console.log('🧠 JARVIS Alerts: Starting proactive monitoring...');

    // Get current business metrics
    const context = await getBusinessContext(supabase);
    const alerts: any[] = [];

    // 1. Revenue Alert - Compare to last week same day
    const lastWeekSameDay = new Date();
    lastWeekSameDay.setDate(lastWeekSameDay.getDate() - 7);
    const lastWeekDate = lastWeekSameDay.toISOString().split('T')[0];

    const { data: lastWeekOrders } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', lastWeekDate)
      .lt('created_at', new Date(lastWeekSameDay.getTime() + 24 * 60 * 60 * 1000).toISOString());

    const lastWeekRevenue = lastWeekOrders?.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0) || 0;

    if (lastWeekRevenue > 0 && context.today_revenue < lastWeekRevenue * 0.85) {
      const dropPercent = ((1 - context.today_revenue / lastWeekRevenue) * 100).toFixed(1);
      alerts.push({
        type: 'revenue_drop',
        severity: 'high',
        message: `Revenue down ${dropPercent}% vs last week (RM ${context.today_revenue.toFixed(2)} vs RM ${lastWeekRevenue.toFixed(2)})`,
        data: { today: context.today_revenue, last_week: lastWeekRevenue, drop_percent: dropPercent }
      });
    }

    // 2. Critical Stock Alert
    if (context.critical_stock > 0) {
      const { data: items } = await supabase
        .from('inventory_items')
        .select('id, name, current_qty, reorder_point');

      const critical = items?.filter((i: any) => {
        const isLowStock = i.current_qty <= i.reorder_point;
        if (!isLowStock) return false;
        const daysUntilStockout = i.current_qty / Math.max(1, i.reorder_point / 7);
        return daysUntilStockout < 2;
      }) || [];

      alerts.push({
        type: 'stock_critical',
        severity: 'critical',
        message: `${critical.length} items will run out in <48 hours`,
        data: { 
          items: critical.map((i: any) => ({ name: i.name, qty: i.current_qty })),
          count: critical.length
        }
      });
    }

    // 3. Operational Efficiency - Slow orders
    const { data: slowOrders } = await supabase
      .from('orders')
      .select('id, created_at, status')
      .in('status', ['pending', 'preparing'])
      .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());

    if (slowOrders && slowOrders.length > 5) {
      alerts.push({
        type: 'slow_fulfillment',
        severity: 'medium',
        message: `${slowOrders.length} orders pending >30 min`,
        data: { count: slowOrders.length }
      });
    }

    // 4. Excessive voids/discounts
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('status, discount, total')
      .gte('created_at', new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()); // Last 3 hours

    if (recentOrders && recentOrders.length > 0) {
      const voidCount = recentOrders.filter((o: any) => o.status === 'void').length;
      const voidRate = (voidCount / recentOrders.length) * 100;

      if (voidRate > 5) {
        alerts.push({
          type: 'excessive_voids',
          severity: 'high',
          message: `Void rate at ${voidRate.toFixed(1)}% (${voidCount}/${recentOrders.length} orders)`,
          data: { void_count: voidCount, total_orders: recentOrders.length, void_rate: voidRate }
        });
      }

      const totalDiscount = recentOrders.reduce((sum: number, o: any) => sum + (Number(o.discount) || 0), 0);
      const totalRevenue = recentOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
      const discountRate = totalRevenue > 0 ? (totalDiscount / totalRevenue) * 100 : 0;

      if (discountRate > 10) {
        alerts.push({
          type: 'excessive_discounts',
          severity: 'medium',
          message: `Discount rate at ${discountRate.toFixed(1)}% of revenue`,
          data: { total_discount: totalDiscount, total_revenue: totalRevenue, discount_rate: discountRate }
        });
      }
    }

    console.log(`🔔 Found ${alerts.length} alerts`);

    // If alerts exist, insert them into database (simplified - no JARVIS external API call)
    if (alerts.length > 0) {
      try {
        // Get managers to notify
        const { data: managers } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('role', ['manager', 'admin']);

        // Insert alerts into database
        const alertInserts = alerts.map(alert => ({
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          jarvis_analysis: `Alert detected: ${alert.message}`,
          status: 'active'
        }));

        await supabase.from('jarvis_alerts').insert(alertInserts);

        console.log(`✅ Inserted ${alertInserts.length} alerts to database`);
      } catch (insertError) {
        console.error('Alert insertion error:', insertError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        alerts_count: alerts.length,
        alerts,
        context,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('JARVIS Alerts error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
