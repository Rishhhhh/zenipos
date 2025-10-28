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
        server: 'mcp-menu',
        description: 'Menu management and item configuration',
        tools: [
          {
            name: "get_menu_structure",
            description: "Get complete menu with categories and items",
            inputSchema: {
              type: "object",
              properties: {
                branch_id: { type: "string" },
                include_archived: { type: "boolean", default: false }
              }
            }
          },
          {
            name: "get_item_profitability",
            description: "Calculate item profitability (revenue vs cost)",
            inputSchema: {
              type: "object",
              properties: {
                item_id: { type: "string", format: "uuid" }
              },
              required: ["item_id"]
            }
          },
          {
            name: "update_menu_item_price",
            description: "Update menu item price (SuperAdmin only)",
            inputSchema: {
              type: "object",
              properties: {
                item_id: { type: "string", format: "uuid" },
                new_price: { type: "number" }
              },
              required: ["item_id", "new_price"]
            }
          },
          {
            name: "toggle_item_availability",
            description: "Enable/disable menu item (SuperAdmin only)",
            inputSchema: {
              type: "object",
              properties: {
                item_id: { type: "string", format: "uuid" },
                in_stock: { type: "boolean" }
              },
              required: ["item_id", "in_stock"]
            }
          }
        ],
        resources: [
          {
            uri: "menu://items",
            name: "Menu Items",
            description: "All active menu items",
            mimeType: "application/json"
          },
          {
            uri: "menu://categories",
            name: "Menu Categories",
            description: "All menu categories",
            mimeType: "application/json"
          }
        ]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'execute_tool') {
      switch (tool) {
        case 'get_menu_structure': {
          let itemQuery = supabase.from('menu_items')
            .select('*, menu_categories(*)');
          
          if (!args?.include_archived) {
            itemQuery = itemQuery.eq('archived', false);
          }
          if (args?.branch_id) {
            itemQuery = itemQuery.eq('branch_id', args.branch_id);
          }
          
          const { data, error } = await itemQuery;
          return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'get_item_profitability': {
          const { item_id } = args;
          
          const { data: item, error: itemError } = await supabase
            .from('menu_items')
            .select('name, price, cost')
            .eq('id', item_id)
            .single();
          
          if (itemError) throw itemError;
          
          const { data: sales, error: salesError } = await supabase
            .from('order_items')
            .select('quantity, unit_price')
            .eq('menu_item_id', item_id);
          
          if (salesError) throw salesError;
          
          const totalRevenue = sales?.reduce((sum, s) => sum + (s.quantity * s.unit_price), 0) || 0;
          const totalCost = sales?.reduce((sum, s) => sum + (s.quantity * (item.cost || 0)), 0) || 0;
          const profit = totalRevenue - totalCost;
          const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: { 
                item_name: item.name,
                total_revenue: totalRevenue,
                total_cost: totalCost,
                profit,
                margin_percentage: margin
              } 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        case 'update_menu_item_price': {
          const { item_id, new_price } = args;
          
          const { error } = await supabase
            .from('menu_items')
            .update({ price: new_price })
            .eq('id', item_id);
          
          if (error) throw error;
          
          return new Response(
            JSON.stringify({ success: true, data: { item_id, new_price } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        case 'toggle_item_availability': {
          const { item_id, in_stock } = args;
          
          const { error } = await supabase
            .from('menu_items')
            .update({ in_stock })
            .eq('id', item_id);
          
          if (error) throw error;
          
          return new Response(
            JSON.stringify({ success: true, data: { item_id, in_stock } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    if (action === 'read_resource') {
      if (resourceUri === 'menu://items') {
        const { data, error } = await supabase.from('menu_items')
          .select('*, menu_categories(*)')
          .eq('archived', false)
          .eq('in_stock', true);
        
        return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (resourceUri === 'menu://categories') {
        const { data, error } = await supabase.from('menu_categories')
          .select('*')
          .order('sort_order', { ascending: true });
        
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
    console.error('MCP-Menu Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
