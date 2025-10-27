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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🧾 Starting B2C e-Invoice consolidation');

    // Get last month's date
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const monthKey = lastMonth.toISOString().slice(0, 7) + '-01';

    // Get all B2C orders from last month
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total, tax, branch_id')
      .gte('created_at', monthKey)
      .lt('created_at', new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1).toISOString())
      .not('id', 'in', `(SELECT order_id FROM einvoice_docs WHERE mode = 'b2b')`);

    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ message: 'No B2C orders to consolidate' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group by branch
    const byBranch = orders.reduce((acc: any, order) => {
      const branchId = order.branch_id || 'default';
      if (!acc[branchId]) {
        acc[branchId] = { orders: 0, amount: 0, tax: 0 };
      }
      acc[branchId].orders++;
      acc[branchId].amount += order.total;
      acc[branchId].tax += order.tax;
      return acc;
    }, {});

    // Create consolidation buckets
    for (const [branchId, stats] of Object.entries(byBranch)) {
      await supabase.from('b2c_consolidation_buckets').upsert({
        month: monthKey,
        branch_id: branchId === 'default' ? null : branchId,
        outlet_name: 'ZENI Restaurant',
        total_orders: (stats as any).orders,
        total_amount: (stats as any).amount,
        total_tax: (stats as any).tax,
        status: 'pending',
      });
    }

    console.log('✅ Consolidation complete');

    return new Response(JSON.stringify({ 
      success: true,
      consolidated: Object.keys(byBranch).length,
      totalOrders: orders.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('❌ Consolidation failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
