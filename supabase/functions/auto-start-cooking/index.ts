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

    console.log('🍳 Auto-start cooking: Checking kitchen_queue orders...');

    // Get orders in kitchen_queue for more than 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const { data: ordersToStart, error: fetchError } = await supabase
      .from('orders')
      .select('id, created_at, order_type, table_id')
      .eq('status', 'kitchen_queue')
      .lt('created_at', twoMinutesAgo);

    if (fetchError) {
      console.error('❌ Error fetching orders:', fetchError);
      throw fetchError;
    }

    if (!ordersToStart || ordersToStart.length === 0) {
      console.log('✅ No orders to auto-start');
      return new Response(
        JSON.stringify({ message: 'No orders to start', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`📊 Found ${ordersToStart.length} orders to start cooking`);

    // Update orders to preparing status
    const { data: updatedOrders, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'preparing',
        updated_at: new Date().toISOString()
      })
      .in('id', ordersToStart.map(o => o.id))
      .select();

    if (updateError) {
      console.error('❌ Error updating orders:', updateError);
      throw updateError;
    }

    console.log(`✅ Successfully started cooking for ${updatedOrders?.length || 0} orders`);

    // Log to audit
    for (const order of updatedOrders || []) {
      await supabase.from('audit_log').insert({
        actor: null,
        action: 'auto_start_cooking',
        entity: 'orders',
        entity_id: order.id,
        diff: { from: 'kitchen_queue', to: 'preparing', trigger: 'auto_2min' }
      });
    }

    return new Response(
      JSON.stringify({ 
        message: 'Orders auto-started', 
        count: updatedOrders?.length || 0,
        orders: updatedOrders?.map(o => o.id)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Auto-start cooking error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
