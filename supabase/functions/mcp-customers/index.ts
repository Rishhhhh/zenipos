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
        server: 'mcp-customers',
        description: 'Customer relationship management and loyalty',
        tools: [
          {
            name: "get_top_customers",
            description: "Get top customers by spending",
            inputSchema: {
              type: "object",
              properties: {
                limit: { type: "number", default: 10 }
              }
            }
          },
          {
            name: "get_customer_stats",
            description: "Get detailed customer loyalty statistics",
            inputSchema: {
              type: "object",
              properties: {
                customer_id: { type: "string" }
              },
              required: ["customer_id"]
            }
          }
        ],
        resources: [
          {
            uri: "customers://loyalty-stats",
            name: "Loyalty Statistics",
            description: "Overall loyalty program stats",
            mimeType: "application/json"
          },
          {
            uri: "customers://top-spenders",
            name: "Top Spenders",
            description: "Top 20 customers by total spend",
            mimeType: "application/json"
          }
        ]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'execute_tool') {
      switch (tool) {
        case 'get_top_customers': {
          const { data, error } = await supabase.rpc('get_top_loyal_customers', {
            limit_count: args?.limit || 10
          });
          return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'get_customer_stats': {
          const { data, error } = await supabase.rpc('get_customer_loyalty_stats', {
            customer_id_param: args.customer_id
          });
          return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    if (action === 'read_resource') {
      if (resourceUri === 'customers://loyalty-stats') {
        const { data: customers, error } = await supabase.from('customers')
          .select('loyalty_points, total_spent, total_orders');
        
        if (!error && customers) {
          const stats = {
            total_customers: customers.length,
            total_points_issued: customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0),
            total_customer_spend: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
            average_customer_value: customers.length > 0 
              ? customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / customers.length 
              : 0
          };
          return new Response(JSON.stringify({ success: true, data: stats }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify({ success: false, error: error?.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (resourceUri === 'customers://top-spenders') {
        const { data, error } = await supabase.rpc('get_top_loyal_customers', {
          limit_count: 20
        });
        
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
    console.error('MCP-Customers Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
