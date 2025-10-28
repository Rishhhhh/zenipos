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
            description: "Calculate profit margins for menu items",
            inputSchema: {
              type: "object",
              properties: {
                item_id: { type: "string" }
              }
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
          const { data: item, error } = await supabase.from('menu_items')
            .select('name, price, cost')
            .eq('id', args.item_id)
            .single();
          
          if (!error && item) {
            const profit = item.price - item.cost;
            const marginPercent = item.price > 0 ? (profit / item.price) * 100 : 0;
            
            return new Response(JSON.stringify({ 
              success: true, 
              data: {
                item_name: item.name,
                price: item.price,
                cost: item.cost,
                profit_per_unit: profit,
                profit_margin_percent: marginPercent
              }
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          return new Response(JSON.stringify({ success: false, error: error?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
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
