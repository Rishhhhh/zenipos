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

    // List capabilities
    if (action === 'list_capabilities') {
      return new Response(JSON.stringify({
        server: 'mcp-pos',
        description: 'Point of Sale operations and order management',
        tools: [
          {
            name: "query_orders",
            description: "Query orders with filters (status, date range, branch)",
            inputSchema: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["pending", "completed", "paid", "cancelled"] },
                date_range: { type: "object", properties: { start: { type: "string" }, end: { type: "string" } } },
                branch_id: { type: "string" },
                limit: { type: "number", default: 50 }
              }
            }
          },
          {
            name: "get_order_stats",
            description: "Get order statistics (count, total revenue, average ticket)",
            inputSchema: {
              type: "object",
              properties: {
                date_range: { type: "object", properties: { start: { type: "string" }, end: { type: "string" } } }
              }
            }
          }
        ],
        resources: [
          {
            uri: "pos://orders/today",
            name: "Today's Orders",
            description: "All orders placed today",
            mimeType: "application/json"
          },
          {
            uri: "pos://orders/pending",
            name: "Pending Orders",
            description: "Orders awaiting completion",
            mimeType: "application/json"
          },
          {
            uri: "pos://sessions/active",
            name: "Active Sessions",
            description: "Currently active POS sessions",
            mimeType: "application/json"
          }
        ]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Execute tool
    if (action === 'execute_tool') {
      switch (tool) {
        case 'query_orders': {
          let query = supabase.from('orders').select('*, order_items(*, menu_items(*))');
          
          if (args?.status) query = query.eq('status', args.status);
          if (args?.branch_id) query = query.eq('branch_id', args.branch_id);
          if (args?.date_range?.start) query = query.gte('created_at', args.date_range.start);
          if (args?.date_range?.end) query = query.lte('created_at', args.date_range.end);
          if (args?.limit) query = query.limit(args.limit);
          
          query = query.order('created_at', { ascending: false });
          
          const { data: orders, error } = await query;
          return new Response(JSON.stringify({ success: !error, data: orders, error: error?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'get_order_stats': {
          let query = supabase.from('orders').select('total, status, created_at');
          
          if (args?.date_range?.start) query = query.gte('created_at', args.date_range.start);
          if (args?.date_range?.end) query = query.lte('created_at', args.date_range.end);
          
          const { data: orders, error } = await query;
          
          if (!error && orders) {
            const stats = {
              total_orders: orders.length,
              total_revenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
              average_ticket: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length : 0,
              by_status: orders.reduce((acc, o) => {
                acc[o.status] = (acc[o.status] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            };
            return new Response(JSON.stringify({ success: true, data: stats }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          return new Response(JSON.stringify({ success: false, error: error?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Read resource
    if (action === 'read_resource') {
      if (resourceUri === 'pos://orders/today') {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('orders')
          .select('*, order_items(*, menu_items(*))')
          .gte('created_at', today)
          .order('created_at', { ascending: false });
        
        return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (resourceUri === 'pos://orders/pending') {
        const { data, error } = await supabase.from('orders')
          .select('*, order_items(*, menu_items(*))')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
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
    console.error('MCP-POS Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
