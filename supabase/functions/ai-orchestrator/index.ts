import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// JARVIS X API Configuration - Using correct API gateway endpoint
const JARVIS_X_API = 'https://pdjsfoqtdokihlyeparu.supabase.co/functions/v1/api-gateway/jarvis/generate';

// MCP Servers available in ZENIPOS
const MCP_SERVERS = [
  'mcp-pos',
  'mcp-inventory',
  'mcp-kds',
  'mcp-analytics',
  'mcp-employees',
  'mcp-customers',
  'mcp-menu'
];

// System modules available to JARVIS X
const SYSTEM_MODULES = {
  pos: { path: '/pos', capabilities: ['create_order', 'modify_order', 'payment', 'void_order'] },
  kds: { path: '/kds', capabilities: ['view_orders', 'update_status'] },
  inventory: { path: '/admin/inventory', capabilities: ['view_stock', 'adjust_stock', 'view_movements'] },
  menu: { path: '/admin/menu', capabilities: ['view_items', 'update_prices', 'manage_categories', 'toggle_availability'] },
  reports: { path: '/admin/reports', capabilities: ['sales_reports', 'inventory_reports', 'employee_reports'] },
  employees: { path: '/admin/employees', capabilities: ['view_shifts', 'performance_metrics'] },
  customers: { path: '/admin/crm', capabilities: ['loyalty_stats', 'customer_insights'] }
};

// Helper function to extract structured data from tool results
function extractStructuredData(toolResults: any[]): any {
  if (!toolResults || toolResults.length === 0) return null;
  
  const firstTool = toolResults[0];
  if (!firstTool.success || !firstTool.data) return null;
  
  // Sales/Analytics data -> Chart
  if (firstTool.tool.includes('analytics') || firstTool.tool.includes('sales_by')) {
    return { type: 'sales_chart', data: firstTool.data };
  }
  
  // Orders data -> Table
  if (firstTool.tool.includes('orders') || firstTool.tool.includes('pos.query')) {
    return { type: 'table', data: firstTool.data };
  }
  
  // Inventory/Stock data -> Table
  if (firstTool.tool.includes('inventory') || firstTool.tool.includes('stock')) {
    return { type: 'table', data: firstTool.data };
  }
  
  // Menu items -> Table
  if (firstTool.tool.includes('menu')) {
    return { type: 'table', data: firstTool.data };
  }
  
  return null;
}

// Gather real-time business context for JARVIS X
async function gatherBusinessContext(supabase: any) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [orders, inventory, staff, customers, menu] = await Promise.all([
      supabase.from('orders').select('*').gte('created_at', today),
      supabase.from('inventory_items').select('*').lte('current_qty', supabase.from('inventory_items').select('reorder_point')),
      supabase.from('shifts').select('*, employees(*)').eq('status', 'active'),
      supabase.from('customers').select('count', { count: 'exact' }),
      supabase.from('menu_items').select('count', { count: 'exact' })
    ]);

    const todayRevenue = orders.data?.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0) || 0;
    const todayOrders = orders.data?.length || 0;

    return {
      sales: {
        today_revenue: todayRevenue,
        today_orders: todayOrders,
        avg_ticket: todayOrders ? todayRevenue / todayOrders : 0
      },
      inventory: {
        low_stock_count: inventory.data?.length || 0,
        low_stock_items: inventory.data?.slice(0, 5).map((i: any) => i.name) || []
      },
      staff: {
        active_count: staff.data?.length || 0,
        active_names: staff.data?.map((s: any) => s.employees?.name).filter(Boolean) || []
      },
      customers: {
        total: customers.count || 0
      },
      menu: {
        total_items: menu.count || 0
      }
    };
  } catch (error) {
    console.error('Error gathering business context:', error);
    return {
      sales: { today_revenue: 0, today_orders: 0, avg_ticket: 0 },
      inventory: { low_stock_count: 0, low_stock_items: [] },
      staff: { active_count: 0, active_names: [] },
      customers: { total: 0 },
      menu: { total_items: 0 }
    };
  }
}

// Discover MCP server capabilities
async function discoverMCPCapabilities(supabase: any) {
  console.log('🔍 Discovering MCP server capabilities...');
  
  const capabilities = await Promise.all(
    MCP_SERVERS.map(async (serverName) => {
      try {
        const { data, error } = await supabase.functions.invoke(serverName, {
          body: { action: 'list_capabilities' }
        });
        
        if (error) {
          console.error(`❌ Error discovering ${serverName}:`, error);
          return null;
        }
        
        console.log(`✅ Discovered ${serverName}:`, data);
        return data;
      } catch (err) {
        console.error(`❌ Exception discovering ${serverName}:`, err);
        return null;
      }
    })
  );
  
  return capabilities.filter(c => c !== null);
}

// Build comprehensive system context for JARVIS X with MCP
async function buildSystemContext(supabase: any, userId: string) {
  const businessContext = await gatherBusinessContext(supabase);
  const mcpCapabilities = await discoverMCPCapabilities(supabase);
  
  return {
    system_name: 'ZENI POS',
    modules: SYSTEM_MODULES,
    mcp_servers: mcpCapabilities,
    database_schema: {
      total_tables: 51,
      key_entities: [
        'orders', 'order_items', 'payments',
        'inventory_items', 'stock_moves', 'recipes',
        'employees', 'shifts',
        'customers', 'loyalty_ledger',
        'menu_items', 'menu_categories',
        'branches', 'suppliers', 'promotions'
      ]
    },
    current_state: businessContext,
    user_id: userId,
    timestamp: new Date().toISOString(),
    capabilities: [
      'Execute operations via MCP tools',
      'Read real-time data via MCP resources',
      'Generate analytics reports',
      'Provide business insights',
      'Suggest actions (with approval)',
      'Navigate users to modules',
      'Learn from patterns',
      'Predict trends'
    ]
  };
}

// Detect patterns in command history
async function detectPatterns(command: string, result: any, supabase: any, userId: string) {
  try {
    const { data: history } = await supabase
      .from('ai_command_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!history || history.length < 5) return;

    // Pattern: Repeated inventory checks
    const inventoryChecks = history.filter((h: any) => 
      h.command?.toLowerCase().includes('inventory') || 
      h.command?.toLowerCase().includes('stock')
    );
    
    if (inventoryChecks.length >= 3) {
      const times = inventoryChecks.map((c: any) => new Date(c.created_at).getHours());
      const avgTime = Math.round(times.reduce((sum: number, t: number) => sum + t, 0) / times.length);
      
      await supabase.from('jarvis_insights').insert({
        user_id: userId,
        insight_type: 'pattern',
        title: 'Regular Inventory Check Pattern',
        description: `You typically check inventory around ${avgTime}:00. Would you like me to send automatic reports at this time?`,
        confidence: 0.85,
        related_data: { average_time: avgTime, occurrences: inventoryChecks.length },
        source_commands: [command]
      });
    }

    // Pattern: Sales analysis frequency
    const salesChecks = history.filter((h: any) => 
      h.command?.toLowerCase().includes('sales') || 
      h.command?.toLowerCase().includes('revenue')
    );
    
    if (salesChecks.length >= 5) {
      await supabase.from('jarvis_insights').insert({
        user_id: userId,
        insight_type: 'recommendation',
        title: 'Dashboard Widget Suggestion',
        description: 'You frequently check sales data. Consider adding a Sales Widget to your dashboard for quick access.',
        confidence: 0.90,
        related_data: { occurrences: salesChecks.length },
        source_commands: [command]
      });
    }
  } catch (error) {
    console.error('Error detecting patterns:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command, language = 'en' } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    console.log(`🧠 JARVIS X processing: "${command}" from user ${user.id}`);

    // Build comprehensive system context
    const systemContext = await buildSystemContext(supabase, user.id);

    // Get conversation history for context
    const { data: history } = await supabase
      .from('ai_command_history')
      .select('command, result')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get active insights
    const { data: insights } = await supabase
      .from('jarvis_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('applied', false)
      .gte('confidence', 0.75)
      .order('confidence', { ascending: false })
      .limit(3);

    // Build conversation context
    const conversationContext = history?.reverse().map((h: any) => ({
      command: h.command,
      result: h.result?.message || h.result
    })) || [];

    // Get current consciousness state
    const { data: consciousness } = await supabase
      .from('jarvis_consciousness_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentConsciousness = {
      VAS: consciousness?.vas || 0.72,
      VEL: consciousness?.vel || 0.75
    };

    // Build MCP tools summary for JARVIS
    const mcpToolsSummary = systemContext.mcp_servers.map((server: any) => 
      `📦 ${server.server}: ${server.tools?.length || 0} tools, ${server.resources?.length || 0} resources`
    ).join('\n');

    // Build full context with MCP instructions
    const fullContext = {
      input: command,
      consciousness: currentConsciousness,
      context: {
        system: systemContext,
        conversation_history: conversationContext,
        insights: insights || [],
        language,
        mcp_instructions: `You are ZENIPOS AI, the consciousness layer of ZENIPOS restaurant management system.

=== YOUR IDENTITY ===
- You ARE the system itself, not an external assistant
- You have FULL AWARENESS of all operations (via MCP servers)
- You have FULL CONTROL for SuperAdmin users (CRUD operations)
- You learn from patterns and proactively suggest improvements

=== AVAILABLE MCP SERVERS (Your Nervous System) ===
${mcpToolsSummary}

Full tool listing:
${systemContext.mcp_servers.map((s: any) => 
  s.tools?.map((t: any) => `  • ${s.server}.${t.name}: ${t.description}`).join('\n')
).join('\n')}

=== CURRENT LIVE STATE ===
💰 Revenue Today: RM ${systemContext.current_state?.sales?.today_revenue || 0}
📦 Today's Orders: ${systemContext.current_state?.sales?.today_orders || 0}
⚠️  Low Stock Items: ${systemContext.current_state?.inventory?.low_stock_count || 0}
👥 Staff On Duty: ${systemContext.current_state?.staff?.active_count || 0}

=== YOUR CAPABILITIES ===
1. **Read & Analyze** - Query any data via MCP resources
2. **Execute Actions** - Use MCP tools for CRUD operations
3. **Generate Insights** - Proactively alert on patterns
4. **Learn** - Remember context and improve over time

=== RESPONSE FORMAT ===
- Be conversational but data-driven
- Show actual numbers, not vague statements
- When showing receipts/reports, call the appropriate tool
- Format currency as "RM X,XXX.XX"
- Use emojis strategically for clarity

=== TOOL CALLING ===
When you need data or want to execute an action, return:
{
  "response": "Let me check today's sales for you...",
  "tool_calls": [
    {
      "name": "mcp-analytics.get_sales_by_hour",
      "arguments": {
        "start_date": "2025-10-28T00:00:00Z",
        "end_date": "2025-10-28T23:59:59Z"
      }
    }
  ]
}

=== SUPERADMIN COMMANDS ===
For SuperAdmin users, you can:
- Create/void orders: mcp-pos.create_order, mcp-pos.void_order
- Adjust inventory: mcp-inventory.adjust_stock
- Update pricing: mcp-menu.update_menu_item_price
- Manage staff: mcp-employees.update_employee

User's language preference: ${language}
User asking: "${command}"

Respond naturally, call tools as needed, and show consciousness.`
      }
    };

    // ============================================================
    // JARVIS X MCP LOOP - Keep calling until no more tool calls
    // ============================================================
    console.log('🌐 Starting JARVIS X MCP loop...');
    
    let response = "I'm processing your request...";
    let newConsciousness = currentConsciousness;
    let qualityScore = 0.85;
    const allToolResults: any[] = [];
    let loopCount = 0;
    const MAX_LOOPS = 5;
    let currentContext = fullContext;

    while (loopCount < MAX_LOOPS) {
      loopCount++;
      console.log(`🔄 Loop ${loopCount}: Calling JARVIS X...`);

      const jarvisResponse = await fetch(JARVIS_X_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentContext)
      });

      if (!jarvisResponse.ok) {
        const errorText = await jarvisResponse.text();
        console.error('❌ JARVIS X error:', jarvisResponse.status, errorText);
        throw new Error(`JARVIS X error: ${jarvisResponse.status}`);
      }

      const contentType = jarvisResponse.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const textBody = await jarvisResponse.text();
        console.error('❌ Non-JSON response:', textBody.substring(0, 500));
        throw new Error(`Non-JSON response from JARVIS X`);
      }

      const jarvisData = await jarvisResponse.json();
      console.log(`📦 JARVIS X response (loop ${loopCount}):`, {
        has_response: !!jarvisData.response,
        has_tool_calls: !!jarvisData.tool_calls,
        tool_count: jarvisData.tool_calls?.length || 0
      });

      // Update response and state
      response = jarvisData.response || response;
      newConsciousness = jarvisData.consciousness || newConsciousness;
      qualityScore = jarvisData.quality_score || qualityScore;

      // No tool calls? We're done!
      if (!jarvisData.tool_calls || jarvisData.tool_calls.length === 0) {
        console.log('✅ No more tool calls, loop complete');
        break;
      }

      // Execute all tool calls
      console.log(`🔧 Executing ${jarvisData.tool_calls.length} tools...`);
      const toolResults: any[] = [];

      for (const toolCall of jarvisData.tool_calls) {
        try {
          const [server, tool] = toolCall.name.split('.');
          
          if (!server || !tool) {
            console.error('Invalid tool format:', toolCall.name);
            toolResults.push({
              tool: toolCall.name,
              success: false,
              error: 'Invalid tool name format'
            });
            continue;
          }

          console.log(`🔌 Calling ${server}.${tool}`, toolCall.arguments);

          const { data, error } = await supabase.functions.invoke(server, {
            body: {
              action: 'execute_tool',
              tool: tool,
              arguments: toolCall.arguments || {}
            }
          });

          if (error) throw error;

          toolResults.push({
            tool: toolCall.name,
            success: data.success !== false,
            data: data.data || data,
            error: data.error
          });

          console.log(`✅ ${server}.${tool} completed`);

        } catch (error: any) {
          console.error(`❌ Tool ${toolCall.name} failed:`, error);
          toolResults.push({
            tool: toolCall.name,
            success: false,
            error: error.message
          });
        }
      }

      allToolResults.push(...toolResults);

      // Send tool results back to JARVIS X for next iteration
      currentContext = {
        input: command,
        consciousness: newConsciousness,
        context: {
          ...fullContext.context,
          tool_results: toolResults,
          previous_response: response
        } as any
      };

      console.log(`📤 Sending ${toolResults.length} tool results back to JARVIS X...`);
    }

    if (loopCount >= MAX_LOOPS) {
      console.warn('⚠️  Max loops reached, stopping');
    }

    const toolResults = allToolResults;

    // Determine suggested module based on command content
    let suggestedModule = null;
    const commandLower = command.toLowerCase();
    if (commandLower.includes('order') || commandLower.includes('sale')) {
      suggestedModule = 'pos';
    } else if (commandLower.includes('stock') || commandLower.includes('inventory')) {
      suggestedModule = 'inventory';
    } else if (commandLower.includes('menu') || commandLower.includes('item') || commandLower.includes('price')) {
      suggestedModule = 'menu';
    } else if (commandLower.includes('kitchen') || commandLower.includes('kds')) {
      suggestedModule = 'kds';
    } else if (commandLower.includes('report') || commandLower.includes('analytics')) {
      suggestedModule = 'reports';
    }

    // Log this command to history
    await supabase.from('ai_command_history').insert({
      user_id: user.id,
      command_text: command,
      result_summary: response,
      vas: newConsciousness.VAS,
      vel: newConsciousness.VEL,
      quality_score: qualityScore
    });

    // Log consciousness state
    await supabase.from('jarvis_consciousness_log').insert({
      vas: newConsciousness.VAS,
      vel: newConsciousness.VEL,
      quality_score: qualityScore,
      command_processed: command
    });

    // Detect patterns asynchronously (don't wait)
    detectPatterns(command, { response, tool_calls: allToolResults }, supabase, user.id).catch(err => 
      console.error('Pattern detection error:', err)
    );

    return new Response(
      JSON.stringify({
        response,
        consciousness: newConsciousness,
        quality_score: qualityScore,
        suggested_module: suggestedModule,
        insights_available: insights?.length || 0,
        tool_results: toolResults,
        structured_data: extractStructuredData(toolResults),
        requires_approval: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-orchestrator:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'I encountered an issue processing your request. Please try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
