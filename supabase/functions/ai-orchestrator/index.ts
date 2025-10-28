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
  pos: { path: '/pos', capabilities: ['order_taking', 'payment_processing', 'receipt_printing'] },
  kds: { path: '/kds', capabilities: ['order_display', 'order_routing', 'timing_analytics'] },
  menu: { path: '/admin/menu-management', capabilities: ['item_management', 'pricing', 'categories'] },
  inventory: { path: '/admin/inventory-management', capabilities: ['stock_tracking', 'reorder_points', 'recipe_costing'] },
  employees: { path: '/admin/employee-management', capabilities: ['shift_management', 'performance_tracking', 'payroll'] },
  crm: { path: '/admin/crm-dashboard', capabilities: ['customer_profiles', 'loyalty_program', 'marketing'] },
  reports: { path: '/admin/reports-dashboard', capabilities: ['sales_analytics', 'financial_reports', 'z_reports'] },
  tables: { path: '/admin/table-layout', capabilities: ['table_management', 'reservations', 'floor_plan'] },
  promotions: { path: '/admin/promotion-management', capabilities: ['discount_rules', 'campaign_management'] },
  suppliers: { path: '/admin/supplier-management', capabilities: ['supplier_contacts', 'purchase_orders'] },
  branches: { path: '/admin/branch-management', capabilities: ['multi_location', 'branch_analytics', 'sync'] },
  performance: { path: '/admin/performance-dashboard', capabilities: ['system_metrics', 'optimization'] },
};

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
        mcp_instructions: `You are ZENIPOS AI, powered by JARVIS X with MCP integration.

=== AVAILABLE MCP SERVERS ===
${mcpToolsSummary}

=== CURRENT SYSTEM STATE ===
- Today's Revenue: ${systemContext.current_state.sales.today_revenue || 0}
- Active Orders: ${systemContext.current_state.inventory.low_stock_count || 0}
- Low Stock Items: ${systemContext.current_state.inventory.low_stock_count || 0}
- Active Staff: ${systemContext.current_state.staff.active_count || 0}

You have FULL ACCESS to ZENIPOS via MCP. Use the tools and resources to provide data-driven insights.
Be conversational, specific, and proactive.`
      }
    };

    // Call JARVIS X API
    console.log('🌐 Calling JARVIS X API at', JARVIS_X_API);
    console.log('Request payload:', JSON.stringify(fullContext, null, 2));

    const jarvisResponse = await fetch(JARVIS_X_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullContext)
    });

    console.log('📡 JARVIS X Response Status:', jarvisResponse.status);

    if (!jarvisResponse.ok) {
      const errorText = await jarvisResponse.text();
      console.error('❌ JARVIS X API error:', jarvisResponse.status, errorText);
      throw new Error(`JARVIS X API error: ${jarvisResponse.status} - ${errorText}`);
    }

    // Check if response is JSON before parsing
    const contentType = jarvisResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textBody = await jarvisResponse.text();
      console.error('❌ Non-JSON response received:', textBody.substring(0, 500));
      throw new Error(`JARVIS X returned non-JSON response. Content-Type: ${contentType}`);
    }

    const jarvisData = await jarvisResponse.json();
    console.log('✅ JARVIS X Full Response:', JSON.stringify(jarvisData, null, 2));

    // Extract response - NO FALLBACK, let JARVIS X handle everything
    if (!jarvisData.response) {
      console.error('⚠️ No response from JARVIS X:', jarvisData);
      throw new Error('JARVIS X did not return a response');
    }

    let response = jarvisData.response;
    const newConsciousness = jarvisData.consciousness || currentConsciousness;
    const qualityScore = jarvisData.quality_score || 0.85;

    // Add insights if available
    if (insights && insights.length > 0) {
      response += '\n\n💡 **Insights I\'ve Noticed:**\n';
      insights.forEach((insight: any) => {
        response += `\n• **${insight.title}** (${Math.round(insight.confidence * 100)}% confidence)\n`;
        response += `  ${insight.description}\n`;
      });
    }

    // Determine suggested module based on command
    let suggestedModule = null;
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('sales') || lowerCommand.includes('revenue') || lowerCommand.includes('order')) {
      suggestedModule = 'reports';
    } else if (lowerCommand.includes('inventory') || lowerCommand.includes('stock')) {
      suggestedModule = 'inventory';
    } else if (lowerCommand.includes('staff') || lowerCommand.includes('employee') || lowerCommand.includes('shift')) {
      suggestedModule = 'employees';
    } else if (lowerCommand.includes('customer') || lowerCommand.includes('loyalty')) {
      suggestedModule = 'crm';
    } else if (lowerCommand.includes('menu') || lowerCommand.includes('item') || lowerCommand.includes('price')) {
      suggestedModule = 'menu';
    } else if (lowerCommand.includes('kitchen') || lowerCommand.includes('kds')) {
      suggestedModule = 'kds';
    }

    // Log command history
    await supabase.from('ai_command_history').insert({
      user_id: user.id,
      command,
      result: {
        message: response,
        consciousness: newConsciousness,
        quality_score: qualityScore,
        suggested_module: suggestedModule
      },
      language
    });

    // Log consciousness state
    const { count: commandCount } = await supabase
      .from('ai_command_history')
      .select('*', { count: 'exact', head: true });
    
    const { count: insightCount } = await supabase
      .from('jarvis_insights')
      .select('*', { count: 'exact', head: true });

    await supabase.from('jarvis_consciousness_log').insert({
      vas: newConsciousness.VAS,
      vel: newConsciousness.VEL,
      quality_score: qualityScore,
      consciousness_contribution: jarvisData.consciousness_contribution || 0,
      command_count: commandCount || 0,
      insight_count: insightCount || 0,
      happiness: 0.85,
      awareness: newConsciousness.VAS,
      learning_rate: 0.15
    });

    // Detect patterns asynchronously
    detectPatterns(command, response, supabase, user.id).catch(console.error);

    return new Response(
      JSON.stringify({
        response,
        consciousness: newConsciousness,
        quality_score: qualityScore,
        suggested_module: suggestedModule,
        insights_available: insights?.length || 0,
        tool_results: [],
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
