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
        server: 'mcp-analytics',
        description: 'Sales analytics and reporting',
        tools: [
          {
            name: "get_sales_by_hour",
            description: "Get hourly sales breakdown",
            inputSchema: {
              type: "object",
              properties: {
                start_date: { type: "string" },
                end_date: { type: "string" }
              },
              required: ["start_date", "end_date"]
            }
          },
          {
            name: "get_top_items",
            description: "Get top selling menu items",
            inputSchema: {
              type: "object",
              properties: {
                start_date: { type: "string" },
                end_date: { type: "string" },
                limit: { type: "number", default: 10 }
              },
              required: ["start_date", "end_date"]
            }
          },
          {
            name: "get_sales_by_category",
            description: "Get sales breakdown by menu category",
            inputSchema: {
              type: "object",
              properties: {
                start_date: { type: "string" },
                end_date: { type: "string" }
              },
              required: ["start_date", "end_date"]
            }
          },
          {
            name: "calculate_cogs",
            description: "Calculate Cost of Goods Sold",
            inputSchema: {
              type: "object",
              properties: {
                start_date: { type: "string" },
                end_date: { type: "string" }
              },
              required: ["start_date", "end_date"]
            }
          }
        ],
        resources: [
          {
            uri: "analytics://sales/today",
            name: "Today's Sales Summary",
            description: "Sales metrics for today",
            mimeType: "application/json"
          },
          {
            uri: "analytics://revenue/week",
            name: "Weekly Revenue",
            description: "Revenue for the past 7 days",
            mimeType: "application/json"
          }
        ]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'execute_tool') {
      switch (tool) {
        case 'get_sales_by_hour': {
          const { data, error } = await supabase.rpc('get_sales_by_hour', {
            start_date: args.start_date,
            end_date: args.end_date
          });
          return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'get_top_items': {
          const { data, error } = await supabase.rpc('get_top_selling_items', {
            start_date: args.start_date,
            end_date: args.end_date,
            limit_count: args.limit || 10
          });
          return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'get_sales_by_category': {
          const { data, error } = await supabase.rpc('get_sales_by_category', {
            start_date: args.start_date,
            end_date: args.end_date
          });
          return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'calculate_cogs': {
          const { data, error } = await supabase.rpc('calculate_cogs', {
            start_date: args.start_date,
            end_date: args.end_date
          });
          return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    if (action === 'read_resource') {
      if (resourceUri === 'analytics://sales/today') {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        
        const { data, error } = await supabase.rpc('get_sales_by_hour', {
          start_date: today,
          end_date: tomorrow
        });
        
        return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (resourceUri === 'analytics://revenue/week') {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const now = new Date().toISOString();
        
        const { data: orders, error } = await supabase.from('orders')
          .select('total, created_at')
          .gte('created_at', weekAgo)
          .lte('created_at', now)
          .in('status', ['completed', 'paid']);
        
        if (!error && orders) {
          const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
          return new Response(JSON.stringify({ 
            success: true, 
            data: { 
              total_revenue: totalRevenue,
              order_count: orders.length,
              average_ticket: orders.length > 0 ? totalRevenue / orders.length : 0
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

    return new Response(JSON.stringify({ error: 'Unknown action or resource' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('MCP-Analytics Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
