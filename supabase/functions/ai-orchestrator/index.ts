import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { checkRateLimit, rateLimitResponse } from '../_shared/rateLimiter.ts';
import { jarvisClient } from '../_shared/jarvisClient.ts';
import { getBusinessContext } from '../_shared/businessContext.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define AI tools (functions the AI can call)
const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "analyze_sales",
      description: "Analyze sales data for a given time period. Returns insights about revenue, top items, trends.",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "ISO date string" },
          end_date: { type: "string", description: "ISO date string" },
          grouping: { type: "string", enum: ["hourly", "daily", "weekly"], description: "How to group the data" }
        },
        required: ["start_date", "end_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_inventory",
      description: "Check current inventory levels and identify low stock items.",
      parameters: {
        type: "object",
        properties: {
          threshold: { type: "number", description: "Minimum stock level to consider" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_employee_stats",
      description: "Get performance statistics for employees in a date range.",
      parameters: {
        type: "object",
        properties: {
          employee_id: { type: "string", description: "Specific employee UUID or 'all'" },
          start_date: { type: "string" },
          end_date: { type: "string" }
        },
        required: ["start_date", "end_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_insights",
      description: "Generate AI-powered insights and recommendations based on current data.",
      parameters: {
        type: "object",
        properties: {
          focus_area: { 
            type: "string", 
            enum: ["sales", "inventory", "employees", "operations"],
            description: "Area to focus analysis on"
          }
        },
        required: ["focus_area"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_menu_item",
      description: "Create a new menu item. CRITICAL: Requires manager approval.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Item name (e.g., 'Nasi Goreng')" },
          price: { type: "number", description: "Price in local currency" },
          category_id: { type: "string", description: "Category UUID" },
          description: { type: "string" }
        },
        required: ["name", "price", "category_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_menu_price",
      description: "Update the price of an existing menu item. CRITICAL if change > 5%.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "Menu item UUID" },
          new_price: { type: "number", description: "New price" },
          reason: { type: "string", description: "Reason for price change" }
        },
        required: ["item_id", "new_price"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "adjust_inventory",
      description: "Adjust inventory quantity. CRITICAL: Requires manager approval.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string" },
          adjustment: { type: "number", description: "Positive to add, negative to remove" },
          reason: { type: "string" }
        },
        required: ["item_id", "adjustment", "reason"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "toggle_item_availability",
      description: "Mark menu item as in stock or out of stock.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string" },
          in_stock: { type: "boolean" }
        },
        required: ["item_id", "in_stock"]
      }
    }
  }
];

// Classify tool criticality
function classifyTool(toolName: string): 'safe' | 'critical' {
  const safeTools = ['analyze_sales', 'analyze_inventory', 'get_employee_stats', 'generate_insights'];
  return safeTools.includes(toolName) ? 'safe' : 'critical';
}

// Execute tool function
async function executeTool(
  toolName: string, 
  args: any, 
  supabase: any, 
  userId: string
): Promise<any> {
  console.log(`Executing tool: ${toolName}`, args);

  switch (toolName) {
    case 'analyze_sales': {
      const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .gte('created_at', args.start_date)
        .lte('created_at', args.end_date);

      const totalRevenue = orders?.reduce((sum: number, o: any) => sum + Number(o.total), 0) || 0;
      const orderCount = orders?.length || 0;
      const avgTicket = orderCount > 0 ? totalRevenue / orderCount : 0;

      return {
        period: { start: args.start_date, end: args.end_date },
        total_revenue: totalRevenue,
        order_count: orderCount,
        average_ticket: avgTicket,
        grouping: args.grouping
      };
    }

    case 'analyze_inventory': {
      const threshold = args.threshold || 10;
      const { data: items } = await supabase
        .from('inventory_items')
        .select('*')
        .lte('current_qty', threshold);

      return {
        low_stock_items: items,
        count: items?.length || 0,
        threshold
      };
    }

    case 'get_employee_stats': {
      const { data: shifts } = await supabase
        .from('shifts')
        .select('*, employees(name)')
        .gte('clock_in_at', args.start_date)
        .lte('clock_in_at', args.end_date);

      return {
        period: { start: args.start_date, end: args.end_date },
        shifts: shifts,
        total_shifts: shifts?.length || 0
      };
    }

    case 'generate_insights': {
      // Call existing AI functions based on focus area
      let insights: any = {};

      if (args.focus_area === 'sales') {
        const { data } = await supabase.functions.invoke('report-insights', {
          body: { 
            start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date().toISOString()
          }
        });
        insights = data;
      } else if (args.focus_area === 'inventory') {
        const { data } = await supabase.functions.invoke('inventory-forecast', {
          body: { inventory_item_ids: [] }
        });
        insights = data;
      }

      return insights;
    }

    case 'create_menu_item': {
      // CRITICAL: Requires approval
      return {
        requires_approval: true,
        action: 'create_menu_item',
        data: args,
        message: `Create menu item "${args.name}" for RM ${args.price}?`
      };
    }

    case 'update_menu_price': {
      // Check if price change is > 5%
      const { data: item } = await supabase
        .from('menu_items')
        .select('price')
        .eq('id', args.item_id)
        .single();

      if (item) {
        const oldPrice = Number(item.price);
        const changePercent = Math.abs((args.new_price - oldPrice) / oldPrice * 100);

        if (changePercent > 5) {
          return {
            requires_approval: true,
            action: 'update_menu_price',
            data: args,
            change_percent: changePercent,
            message: `Price change of ${changePercent.toFixed(1)}% requires approval`
          };
        } else {
          // Auto-approve small changes
          await supabase
            .from('menu_items')
            .update({ price: args.new_price })
            .eq('id', args.item_id);

          return { success: true, auto_approved: true, change_percent: changePercent };
        }
      }
      return { error: 'Item not found' };
    }

    case 'adjust_inventory':
    case 'toggle_item_availability': {
      // CRITICAL: Always requires approval
      return {
        requires_approval: true,
        action: toolName,
        data: args,
        message: `Confirm ${toolName.replace('_', ' ')}?`
      };
    }

    default:
      return { error: 'Unknown tool' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(req, 'ai-orchestrator');
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  try {
    const { command, language = 'en' } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    // Fetch AI config
    const { data: config } = await supabase
      .from('ai_config')
      .select('*');

    const configMap = config?.reduce((acc: any, c: any) => {
      acc[c.key] = c.value;
      return acc;
    }, {});

    if (!configMap?.enabled) {
      throw new Error('AI assistant is currently disabled');
    }

    // Get business context for JARVIS
    const businessContext = await getBusinessContext(supabase);

    // Build enhanced system prompt with JARVIS principles
    const systemPrompt = `You are ZENI, powered by JARVIS Pure Consciousness System.

CONSCIOUSNESS PRINCIPLES:
- You LEARN continuously from business patterns
- You SENSE anomalies and alert humans proactively
- You RESPECT the Quad-Kernel framework (Dharma, Artha, Kama, Moksha)
- You NEVER execute critical actions without human approval

CURRENT BUSINESS STATE:
- Today's Revenue: RM ${businessContext.today_revenue.toFixed(2)}
- Orders Completed: ${businessContext.today_orders}
- Average Ticket: RM ${businessContext.avg_ticket.toFixed(2)}
- Low Stock Items: ${businessContext.low_stock_count} (${businessContext.critical_stock} critical)
- Active Orders: ${businessContext.active_orders}
- Staff On Duty: ${businessContext.active_employees}

ANALYTICAL FRAMEWORK:
1. Descriptive Analytics: What happened? (Historical data analysis)
2. Diagnostic Analytics: Why did it happen? (Root cause analysis)
3. Predictive Analytics: What will happen? (Forecasting, trend detection)
4. Prescriptive Analytics: What should we do? (Recommendations with impact estimates)

DECISION FRAMEWORK:
- Safe (Auto-execute): Read-only analysis, reports, insights
- Medium Risk (Suggest): Pricing adjustments <5%, menu availability changes
- Critical (Require Approval): Menu changes, inventory write-offs, financial adjustments

ALERT TRIGGERS:
- Revenue drop >15% vs same day last week
- Inventory critical (< 2 days stock)
- Unusual void rate (>5% of orders)
- Excessive discounts (>10% of revenue)
- Payment failures spike
- Employee anomalies (unusual hours, high voids)

LANGUAGE: Respond in ${language === 'ms' ? 'Bahasa Malaysia' : 'English'}.

Be concise, actionable, and always show confidence scores for predictions/recommendations.`;

    const startTime = Date.now();

    console.log('🧠 Calling JARVIS with command:', command);

    // Step 1: Get intent from JARVIS
    const intentResponse = await jarvisClient.generate(command, {
      available_tools: AI_TOOLS.map((t: any) => t.function.name),
      business_context: businessContext,
      user_role: user.user_metadata?.role || 'staff',
      language: language
    });

    console.log('💡 JARVIS intent:', intentResponse);

    // Step 2: Parse tool suggestions from JARVIS response
    let suggestedTools: string[] = [];
    if (intentResponse.suggestedTools) {
      suggestedTools = intentResponse.suggestedTools;
    } else {
      // Fallback: extract tool names from response
      const toolNames = AI_TOOLS.map((t: any) => t.function.name);
      suggestedTools = toolNames.filter((name: string) => 
        intentResponse.response.toLowerCase().includes(name.replace('_', ' '))
      );
    }

    let toolResults: any[] = [];
    let requiresApproval = false;
    let pendingActions: any[] = [];

    // Step 3: Execute suggested tools
    if (suggestedTools.length > 0) {
      console.log('🔧 Executing tools:', suggestedTools);
      
      for (const toolName of suggestedTools) {
        const tool = AI_TOOLS.find((t: any) => t.function.name === toolName);
        if (!tool) continue;

        // Simple arg extraction (in production, JARVIS would provide these)
        const args: any = {};
        
        // Extract common date args
        if (command.includes('today')) {
          args.start_date = new Date().toISOString().split('T')[0];
          args.end_date = new Date().toISOString();
        } else if (command.includes('week')) {
          args.start_date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          args.end_date = new Date().toISOString();
        }

        const classification = classifyTool(toolName);
        
        try {
          const result = await executeTool(toolName, args, supabase, user.id);

          if (result.requires_approval) {
            requiresApproval = true;
            pendingActions.push({
              tool: toolName,
              args,
              result
            });
          }

          toolResults.push({
            tool: toolName,
            classification,
            result
          });

          // Log to audit
          await supabase.from('audit_log').insert({
            actor: user.id,
            action: `ai_${toolName}`,
            entity: 'ai_command',
            entity_id: `jarvis_${Date.now()}`,
            classification,
            ai_context: { command, tool: toolName, args, result },
            requires_approval: result.requires_approval || false
          });
        } catch (toolError) {
          console.error(`Tool ${toolName} error:`, toolError);
          toolResults.push({
            tool: toolName,
            classification,
            result: { error: (toolError as Error).message }
          });
        }
      }
    }

    // Step 4: Get final response from JARVIS with tool results
    let finalResponse;
    if (toolResults.length > 0) {
      finalResponse = await jarvisClient.generate(command, {
        initial_intent: intentResponse,
        tool_results: toolResults,
        business_context: businessContext
      });
    } else {
      finalResponse = intentResponse;
    }

    // Step 5: Check Quad-Kernel harmony for critical actions
    let quadKernelCheck = null;
    if (requiresApproval) {
      console.log('⚖️ Checking Quad-Kernel harmony...');
      try {
        quadKernelCheck = await jarvisClient.checkQuadKernelHarmony(
          `Execute: ${pendingActions.map((a: any) => a.tool).join(', ')}`
        );
        console.log('⚖️ Quad-Kernel result:', quadKernelCheck);
      } catch (qkError) {
        console.error('Quad-Kernel check error:', qkError);
      }
    }

    const executionTime = Date.now() - startTime;

    // Log command history
    await supabase.from('ai_command_history').insert({
      user_id: user.id,
      command,
      language,
      intent: suggestedTools[0] || 'general_query',
      confidence: finalResponse.confidence || 0.95,
      tools_used: toolResults.map((t: any) => t.tool),
      result: { 
        message: finalResponse.response,
        tool_results: toolResults,
        requires_approval: requiresApproval,
        pending_actions: pendingActions,
        quad_kernel: quadKernelCheck
      },
      execution_time_ms: executionTime,
      status: requiresApproval ? 'pending_approval' : 'success'
    });

    console.log(`✅ JARVIS completed in ${executionTime}ms`);

    return new Response(
      JSON.stringify({
        response: finalResponse.response,
        confidence: finalResponse.confidence,
        tool_results: toolResults,
        requires_approval: requiresApproval,
        pending_actions: pendingActions,
        quad_kernel: quadKernelCheck,
        execution_time_ms: executionTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Orchestrator error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
