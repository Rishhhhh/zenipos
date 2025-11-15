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

    console.log('🍽️ Auto-progress serving: Checking ready orders...');

    // Get orders that are ready (no time limit - immediate transition)
    const { data: ordersToServe, error: fetchError } = await supabase
      .from('orders')
      .select('id, ready_at, order_type, table_id')
      .eq('status', 'ready');

    if (fetchError) {
      console.error('❌ Error fetching orders:', fetchError);
      throw fetchError;
    }

    if (!ordersToServe || ordersToServe.length === 0) {
      console.log('✅ No orders to auto-serve');
      return new Response(
        JSON.stringify({ message: 'No orders to serve', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`📊 Found ${ordersToServe.length} orders to start serving`);

    // Update orders to serving status
    const { data: updatedOrders, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'serving',
        serving_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', ordersToServe.map(o => o.id))
      .select();

    if (updateError) {
      console.error('❌ Error updating orders:', updateError);
      throw updateError;
    }

    console.log(`✅ Successfully started serving ${updatedOrders?.length || 0} orders`);

    // Log to audit
    for (const order of updatedOrders || []) {
      await supabase.from('audit_log').insert({
        actor: null,
        action: 'auto_start_serving',
        entity: 'orders',
        entity_id: order.id,
        diff: { from: 'ready', to: 'serving', trigger: 'auto_immediate' }
      });
    }

    return new Response(
      JSON.stringify({ 
        message: 'Orders auto-progressed to serving', 
        count: updatedOrders?.length || 0,
        orders: updatedOrders?.map(o => o.id)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Auto-progress serving error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
