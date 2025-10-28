import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { action, tool, arguments: args, resourceUri } = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (action === 'list_capabilities') {
      return new Response(JSON.stringify({
        server: 'mcp-inventory',
        description: 'Inventory management and stock tracking',
        tools: [
          {
            name: "get_low_stock",
            description: "Get items below reorder point",
            inputSchema: {
              type: "object",
              properties: {
                branch_id: { type: "string" }
              }
            }
          },
          {
            name: "query_stock_movements",
            description: "Query stock movement history",
            inputSchema: {
              type: "object",
              properties: {
                item_id: { type: "string" },
                type: { type: "string", enum: ["order_consumption", "purchase", "adjustment", "waste"] },
                limit: { type: "number", default: 100 }
              }
            }
          },
          {
            name: "get_inventory_value",
            description: "Calculate total inventory value",
            inputSchema: {
              type: "object",
              properties: {
                branch_id: { type: "string", format: "uuid" }
              }
            }
          },
          {
            name: "adjust_stock",
            description: "Adjust inventory stock levels (SuperAdmin only)",
            inputSchema: {
              type: "object",
              properties: {
                item_id: { type: "string", format: "uuid" },
                quantity: { type: "number" },
                reason: { type: "string" }
              },
              required: ["item_id", "quantity", "reason"]
            }
          }
        ],
        resources: [
          {
            uri: "inventory://low-stock",
            name: "Low Stock Items",
            description: "Items below reorder point",
            mimeType: "application/json"
          },
          {
            uri: "inventory://movements/recent",
            name: "Recent Stock Movements",
            description: "Last 50 stock movements",
            mimeType: "application/json"
          }
        ]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'execute_tool') {
      switch (tool) {
        case 'get_low_stock': {
          const { data, error } = await supabase.rpc('get_low_stock_items');
          return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'query_stock_movements': {
          let query = supabase.from('stock_moves').select('*, inventory_items(name, sku)');
          
          if (args?.item_id) query = query.eq('inventory_item_id', args.item_id);
          if (args?.type) query = query.eq('type', args.type);
          if (args?.limit) query = query.limit(args.limit);
          
          query = query.order('created_at', { ascending: false });
          
          const { data, error } = await query;
          return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'get_inventory_value': {
          const { branch_id } = args;
          
          let query = supabase
            .from('inventory_items')
            .select('current_qty, cost_per_unit');
          
          if (branch_id) {
            query = query.eq('branch_id', branch_id);
          }
          
          const { data, error } = await query;
          if (error) throw error;
          
          const totalValue = data?.reduce((sum, item) => 
            sum + (item.current_qty * item.cost_per_unit), 0
          ) || 0;
          
          return new Response(
            JSON.stringify({ success: true, data: { total_value: totalValue, items_count: data?.length || 0 } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        case 'adjust_stock': {
          const { item_id, quantity, reason } = args;
          
          const { data: item, error: fetchError } = await supabase
            .from('inventory_items')
            .select('current_qty')
            .eq('id', item_id)
            .single();
          
          if (fetchError) throw fetchError;
          
          const newQty = item.current_qty + quantity;
          
          const { error: updateError } = await supabase
            .from('inventory_items')
            .update({ current_qty: newQty })
            .eq('id', item_id);
          
          if (updateError) throw updateError;
          
          // Log stock movement
          await supabase.from('stock_moves').insert({
            inventory_item_id: item_id,
            type: quantity > 0 ? 'adjustment_in' : 'adjustment_out',
            quantity: Math.abs(quantity),
            reason
          });
          
          return new Response(
            JSON.stringify({ success: true, data: { item_id, old_qty: item.current_qty, new_qty: newQty } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    if (action === 'read_resource') {
      if (resourceUri === 'inventory://low-stock') {
        const { data, error } = await supabase.rpc('get_low_stock_items');
        return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (resourceUri === 'inventory://movements/recent') {
        const { data, error } = await supabase.from('stock_moves')
          .select('*, inventory_items(name, sku)')
          .order('created_at', { ascending: false })
          .limit(50);
        
        return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Unknown action or resource' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('MCP-Inventory Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
