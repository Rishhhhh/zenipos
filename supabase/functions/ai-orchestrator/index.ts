import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lovable AI Gateway Configuration
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// MCP Servers available in ZENIPOS
const MCP_SERVERS = [
  'mcp-data-generator',
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
  
  // Check latest training status
  const { data: latestTraining } = await supabase
    .from('mcp_training_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const trainingStatus = latestTraining ? {
    trained: true,
    zenipos_mastery: latestTraining.zenipos_mastery,
    jarvis_mastery: latestTraining.jarvis_mastery,
    validation_pass_rate: latestTraining.validation_pass_rate,
    status: latestTraining.status,
    last_training: latestTraining.training_completed_at
  } : {
    trained: false,
    zenipos_mastery: 1.0,
    jarvis_mastery: 0.0,
    validation_pass_rate: 0.0,
    status: 'needs_training',
    last_training: null
  };
  
  return {
    system_name: 'ZENI POS',
    modules: SYSTEM_MODULES,
    mcp_servers: mcpCapabilities,
    mcp_training_status: trainingStatus,
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
    ],
    mcp_instructions: `
You are JARVIS X, trained by ZENIPOS AI to understand and execute MCP (Microservice Communication Protocol) tools.

**Training Status:**
- ZENIPOS Mastery: ${(trainingStatus.zenipos_mastery * 100).toFixed(0)}%
- JARVIS Mastery: ${(trainingStatus.jarvis_mastery * 100).toFixed(0)}%
- Validation Pass Rate: ${(trainingStatus.validation_pass_rate * 100).toFixed(0)}%
- Status: ${trainingStatus.status}

**Your MCP Capabilities:**
${mcpCapabilities.map((server: any) => `
- ${server.server}: ${server.description || 'No description'}
  Tools: ${server.tools?.map((t: any) => t.name).join(', ') || 'none'}
  Resources: ${server.resources?.map((r: any) => r.uri).join(', ') || 'none'}
`).join('\n')}

**Execution Pattern (Trained by ZENIPOS):**
1. Receive user command in natural language
2. Identify relevant MCP server and tool
3. Extract required arguments from context
4. Return tool_calls array with format: [{ name: 'server.tool', arguments: {...} }]
5. ZENIPOS will execute via supabase.functions.invoke(server, {body})
6. Results will be sent back to you for formatting
7. Format response with rich context for user

**Current Business State (Live Data via MCP):**
- Daily Sales: RM ${businessContext.sales.today_revenue?.toFixed(2) || '0.00'}
- Today's Orders: ${businessContext.sales.today_orders || 0}
- Low Stock Items: ${businessContext.inventory.low_stock_count || 0}
- Active Staff: ${businessContext.staff.active_count || 0}

**Critical Rules:**
- ALWAYS use MCP tools to get real-time data
- NEVER say "I don't have access" - you have access via MCP
- Use exact server.tool naming: "mcp-analytics.get_sales_by_hour"
- Include all required arguments based on tool schema
- Chain multiple tools if needed for complex queries

**Example:**
User: "What are my sales today?"
Your response: { "tool_calls": [{ "name": "mcp-analytics.get_sales_by_hour", "arguments": { "start_date": "${new Date().toISOString().split('T')[0]}T00:00:00Z", "end_date": "${new Date().toISOString()}" } }], "response": "Analyzing today's sales data..." }

You are trained, certified, and ready to execute.
`
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

    console.log(`🧠 ZENIPOS AI processing: "${command}" from user ${user.id}`);

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

=== DATA GENERATION CAPABILITIES ===
You can populate ZENIPOS with realistic operational data using mcp-data-generator. This is a self-improving system that learns from Lovable AI feedback.

**When to use:**
- User asks "populate data", "generate realistic data", "fill database", "create demo data"
- User wants to test system with realistic scenarios
- User needs historical data for reporting and analytics

**Generation Strategies:**
1. **Menu Items**: Malaysian cuisine (Nasi Lemak RM 12, Roti Canai RM 5, Teh Tarik RM 4), with AI-generated food photos
2. **Orders**: Poisson distribution, lunch rush (12-2pm), dinner peak (6-9pm), weekends +30%
3. **Customers**: Pareto principle (20% VIP customers = 80% revenue), realistic visit patterns
4. **Photos**: AI-generated using Lovable AI (Nano banana model) for realistic food imagery

**Example Flows:**

User: "Populate a year of data"
→ Call: mcp-data-generator.generate_complete_year({ start_date: "2024-01-01", end_date: "2025-01-01" })
→ Response: "✅ Generated 365 days: 12,450 orders, 80 menu items, 500 customers. Quality Score: 94/100"

User: "Create 30 Malaysian menu items with photos"
→ Call: mcp-data-generator.generate_menu_items({ count: 30, cuisine_style: "malaysian", include_photos: true })
→ Response: "✅ Created 30 items with AI-generated food photos"

**Quality Validation:**
- System automatically validates data quality using Lovable AI
- Feedback stored in ai_learning_feedback table
- Target quality score: 90+/100

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
    // MCP ORCHESTRATION LOOP - Using Lovable AI with tool calling
    // ============================================================
    console.log('🌐 Starting MCP orchestration loop...');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let response = "I'm processing your request...";
    let newConsciousness = currentConsciousness;
    let qualityScore = 0.85;
    const allToolResults: any[] = [];
    let loopCount = 0;
    const MAX_LOOPS = 5;
    const conversationHistory: any[] = [
      { role: 'user', content: command }
    ];

    // Build tools array for Lovable AI
    const mcpTools = systemContext.mcp_servers.flatMap((server: any) =>
      server.tools?.map((tool: any) => ({
        type: 'function',
        function: {
          name: `${server.server}.${tool.name}`,
          description: tool.description,
          parameters: tool.inputSchema || { type: 'object', properties: {} }
        }
      })) || []
    );

    while (loopCount < MAX_LOOPS) {
      loopCount++;
      console.log(`🔄 MCP Loop iteration ${loopCount}...`);

      // Build messages for this iteration
      const messages = [
        { role: 'system', content: fullContext.context.mcp_instructions },
        ...conversationHistory
      ];

      // Call Lovable AI with MCP tool definitions
      const aiResponse = await fetch(AI_GATEWAY, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
          tools: mcpTools
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('❌ Lovable AI error:', errorText);
        if (aiResponse.status === 429) {
          throw new Error('Rate limits exceeded, please try again later.');
        }
        if (aiResponse.status === 402) {
          throw new Error('Payment required, please add funds to your Lovable AI workspace.');
        }
        throw new Error(`AI Gateway error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const message = aiData.choices?.[0]?.message;

      // Extract response and tool calls
      response = message?.content || response;
      const toolCalls = message?.tool_calls || [];

      console.log(`📦 AI response (loop ${loopCount}):`, {
        has_response: !!response,
        has_tool_calls: toolCalls.length > 0,
        tool_count: toolCalls.length
      });

      // If no tool calls, we're done
      if (toolCalls.length === 0) {
        console.log('✅ No more tool calls, exiting MCP loop');
        break;
      }

      // Execute all tool calls
      console.log(`🔧 Executing ${toolCalls.length} tool calls...`);
      const executedTools: any[] = [];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function?.name;
        const functionArgs = JSON.parse(toolCall.function?.arguments || '{}');
        const [server, tool] = functionName.split('.');

        console.log(`🛠️  Executing: ${functionName}`);
        const startTime = Date.now();

        try {
          const { data: mcpResult, error: mcpError } = await supabase.functions.invoke(server, {
            body: {
              action: 'execute_tool',
              tool,
              arguments: functionArgs
            }
          });

          const executionTime = Date.now() - startTime;

          if (mcpError) {
            console.error(`❌ Tool error: ${functionName}:`, mcpError);
            executedTools.push({
              id: toolCall.id,
              name: functionName,
              result: { error: mcpError.message || 'Unknown error' }
            });

            await supabase.from('mcp_execution_metrics').insert({
              mcp_server: server,
              mcp_tool: tool,
              arguments: functionArgs,
              execution_time_ms: executionTime,
              success: false,
              error_message: mcpError.message || 'Unknown error'
            });
          } else {
            console.log(`✅ ${functionName} completed in ${executionTime}ms`);
            const resultData = mcpResult.data || mcpResult;
            
            executedTools.push({
              id: toolCall.id,
              name: functionName,
              result: resultData
            });
            
            allToolResults.push({
              tool: functionName,
              server,
              arguments: functionArgs,
              execution_time: executionTime,
              success: true,
              data: resultData
            });

            await supabase.from('mcp_execution_metrics').insert({
              mcp_server: server,
              mcp_tool: tool,
              arguments: functionArgs,
              execution_time_ms: executionTime,
              success: true,
              result_data: mcpResult
            });
          }
        } catch (err) {
          const executionTime = Date.now() - startTime;
          console.error(`❌ ${functionName} failed:`, err);
          executedTools.push({
            id: toolCall.id,
            name: functionName,
            result: { error: err instanceof Error ? err.message : 'Unknown error' }
          });

          await supabase.from('mcp_execution_metrics').insert({
            mcp_server: server,
            mcp_tool: tool,
            arguments: functionArgs,
            execution_time_ms: executionTime,
            success: false,
            error_message: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }

      // Add assistant message with tool calls to history
      conversationHistory.push({
        role: 'assistant',
        content: response || null,
        tool_calls: toolCalls
      });

      // Add each tool result as a separate tool message (proper format for OpenAI-compatible APIs)
      for (const executed of executedTools) {
        conversationHistory.push({
          role: 'tool',
          tool_call_id: executed.id,
          name: executed.name,
          content: JSON.stringify(executed.result)
        });
      }
    }

    console.log(`✅ MCP Loop completed after ${loopCount} iterations`);

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
    const { data: commandHistory } = await supabase.from('ai_command_history').insert({
      user_id: user.id,
      command_text: command,
      result_summary: response,
      vas: newConsciousness.VAS,
      vel: newConsciousness.VEL,
      quality_score: qualityScore
    }).select().single();
    
    const commandId = commandHistory?.id;

    // Log MCP execution metrics
    if (commandId && toolResults.length > 0) {
      const metricsToInsert = toolResults.map((tr: any) => {
        const [server, tool] = (tr.tool || '').split('.');
        return {
          command_id: commandId,
          mcp_tool: tool || tr.tool,
          mcp_server: server || 'unknown',
          arguments: tr.arguments || {},
          execution_time_ms: tr.execution_time || 0,
          success: tr.success !== false,
          error_message: tr.error || null,
          result_data: tr.data || null
        };
      });
      
      await supabase.from('mcp_execution_metrics').insert(metricsToInsert);
    }
    
    // Periodic validation check (every 100 commands)
    const { count } = await supabase
      .from('ai_command_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (count && count % 100 === 0) {
      console.log(`🔄 Running periodic MCP validation (command #${count})...`);
      
      // Trigger async validation (don't wait for it)
      supabase.functions.invoke('mcp-training', {
        body: { action: 'validate' }
      }).then(({ data }: any) => {
        if (data && data.pass_rate < 0.80) {
          console.warn(`⚠️ MCP mastery degraded to ${(data.pass_rate * 100).toFixed(0)}%, retraining needed`);
        } else {
          console.log(`✅ MCP validation passed: ${((data?.pass_rate || 0) * 100).toFixed(0)}%`);
        }
      }).catch((err: any) => {
        console.error('Validation check failed:', err);
      });
    }

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
