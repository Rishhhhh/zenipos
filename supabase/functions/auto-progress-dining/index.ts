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

    console.log('🍔 Auto-progress dining: Checking serving orders...');

    // Get orders in serving for more than 3 minutes
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    
    const { data: ordersToDining, error: fetchError } = await supabase
      .from('orders')
      .select('id, serving_at, order_type, table_id')
      .eq('status', 'serving')
      .lt('serving_at', threeMinutesAgo);

    if (fetchError) {
      console.error('❌ Error fetching orders:', fetchError);
      throw fetchError;
    }

    if (!ordersToDining || ordersToDining.length === 0) {
      console.log('✅ No orders to move to dining');
      return new Response(
        JSON.stringify({ message: 'No orders to move to dining', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`📊 Found ${ordersToDining.length} orders to move to dining`);

    // Update orders to dining status
    const { data: updatedOrders, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'dining',
        dining_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', ordersToDining.map(o => o.id))
      .select();

    if (updateError) {
      console.error('❌ Error updating orders:', updateError);
      throw updateError;
    }

    console.log(`✅ Successfully moved ${updatedOrders?.length || 0} orders to dining`);

    // Log to audit
    for (const order of updatedOrders || []) {
      await supabase.from('audit_log').insert({
        actor: null,
        action: 'auto_start_dining',
        entity: 'orders',
        entity_id: order.id,
        diff: { from: 'serving', to: 'dining', trigger: 'auto_3min' }
      });
    }

    return new Response(
      JSON.stringify({ 
        message: 'Orders auto-progressed to dining', 
        count: updatedOrders?.length || 0,
        orders: updatedOrders?.map(o => o.id)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Auto-progress dining error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
