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
        server: 'mcp-employees',
        description: 'Employee management and shift tracking',
        tools: [
          {
            name: "get_active_shifts",
            description: "Get currently active employee shifts",
            inputSchema: {
              type: "object",
              properties: {
                branch_id: { type: "string" }
              }
            }
          },
          {
            name: "get_employee_performance",
            description: "Get employee sales performance",
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
            uri: "employees://active-shifts",
            name: "Active Shifts",
            description: "Currently clocked-in employees",
            mimeType: "application/json"
          },
          {
            uri: "employees://performance",
            name: "Employee Performance",
            description: "Employee performance metrics",
            mimeType: "application/json"
          }
        ]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'execute_tool') {
      switch (tool) {
        case 'get_active_shifts': {
          let query = supabase.from('shifts')
            .select('*, employees(*)')
            .eq('status', 'active')
            .is('clock_out_at', null);
          
          if (args?.branch_id) {
            query = query.eq('employees.branch_id', args.branch_id);
          }
          
          const { data, error } = await query;
          return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'get_employee_performance': {
          const { data, error } = await supabase.rpc('get_sales_by_employee', {
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
      if (resourceUri === 'employees://active-shifts') {
        const { data, error } = await supabase.from('shifts')
          .select('*, employees(*)')
          .eq('status', 'active')
          .is('clock_out_at', null);
        
        return new Response(JSON.stringify({ success: !error, data, error: error?.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (resourceUri === 'employees://performance') {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const now = new Date().toISOString();
        
        const { data, error } = await supabase.rpc('get_sales_by_employee', {
          start_date: weekAgo,
          end_date: now
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
    console.error('MCP-Employees Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
