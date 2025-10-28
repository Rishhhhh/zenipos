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
        server: 'mcp-kds',
        description: 'Kitchen Display System order queue management',
        tools: [
          {
            name: "get_active_orders",
            description: "Get orders currently in kitchen queue",
            inputSchema: {
              type: "object",
              properties: {
                station: { type: "string" }
              }
            }
          },
          {
            name: "get_order_timing_stats",
            description: "Get average preparation times",
            inputSchema: {
              type: "object",
              properties: {
                date_range: { type: "object" }
              }
            }
          }
        ],
        resources: [
          {
            uri: "kds://queue",
            name: "Kitchen Queue",
            description: "Current kitchen order queue",
            mimeType: "application/json"
          },
          {
            uri: "kds://stations",
            name: "Kitchen Stations",
            description: "Available kitchen stations",
            mimeType: "application/json"
          }
        ]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'execute_tool') {
      switch (tool) {
        case 'get_active_orders': {
          const { data, error } = await supabase.from('orders')
            .select('*, order_items(*, menu_items(*))')
            .in('status', ['pending', 'preparing'])
            .order('created_at', { ascending: true });
          
          return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'get_order_timing_stats': {
          const { data, error } = await supabase.from('orders')
            .select('created_at, updated_at, status')
            .in('status', ['completed', 'paid'])
            .order('created_at', { ascending: false })
            .limit(100);
          
          if (!error && data) {
            const timings = data.map(order => {
              const created = new Date(order.created_at).getTime();
              const updated = new Date(order.updated_at).getTime();
              return (updated - created) / 1000 / 60; // minutes
            });
            
            const avgTime = timings.reduce((sum, t) => sum + t, 0) / timings.length;
            
            return new Response(JSON.stringify({ 
              success: true, 
              data: { 
                average_prep_time_minutes: avgTime,
                sample_count: timings.length
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
      if (resourceUri === 'kds://queue') {
        const { data, error } = await supabase.from('orders')
          .select('*, order_items(*, menu_items(*))')
          .in('status', ['pending', 'preparing'])
          .order('created_at', { ascending: true });
        
        return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (resourceUri === 'kds://stations') {
        const { data, error } = await supabase.from('devices')
          .select('*')
          .eq('role', 'KDS');
        
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
    console.error('MCP-KDS Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
