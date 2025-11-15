import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('💳 Auto-complete payments: Checking stuck payment orders...');

    // Get orders in payment for more than 2 minutes (stuck/failed payments)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const { data: ordersToComplete, error: fetchError } = await supabase
      .from('orders')
      .select('id, payment_initiated_at, order_type, table_id, total')
      .eq('status', 'payment')
      .lt('payment_initiated_at', twoMinutesAgo);

    if (fetchError) {
      console.error('❌ Error fetching orders:', fetchError);
      throw fetchError;
    }

    if (!ordersToComplete || ordersToComplete.length === 0) {
      console.log('✅ No stuck payments to auto-complete');
      return new Response(
        JSON.stringify({ message: 'No stuck payments', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`⚠️ Found ${ordersToComplete.length} stuck payment orders`);

    // Update orders to completed status
    const { data: updatedOrders, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .in('id', ordersToComplete.map(o => o.id))
      .select();

    if (updateError) {
      console.error('❌ Error updating orders:', updateError);
      throw updateError;
    }

    console.log(`✅ Auto-completed ${updatedOrders?.length || 0} stuck payment orders`);

    // Log to audit (with warning flag for manual review)
    for (const order of updatedOrders || []) {
      await supabase.from('audit_log').insert({
        actor: null,
        action: 'auto_complete_stuck_payment',
        entity: 'orders',
        entity_id: order.id,
        diff: { 
          from: 'payment', 
          to: 'completed', 
          trigger: 'auto_2min_timeout',
          warning: 'Payment may have failed or been abandoned - requires manual review'
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        message: 'Stuck payments auto-completed', 
        count: updatedOrders?.length || 0,
        orders: updatedOrders?.map(o => o.id),
        warning: 'These orders require manual payment verification'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Auto-complete payments error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
