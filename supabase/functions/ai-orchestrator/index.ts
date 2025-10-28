import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { command, language = 'en' } = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`🧠 JARVIS processing: "${command}" from user ${user.id}`);

    // Simple inline rate limiting (fail-open)
    const rateKey = `rate:${user.id}:ai-orchestrator`;
    // For now, skip complex rate limiting - it's causing deployment issues

    // Process command with keyword matching
    const cmd = command.toLowerCase();
    let response = '';
    const toolResults: any[] = [];

    // Sales queries
    if (cmd.includes('sales') || cmd.includes('jualan') || cmd.includes('revenue') || cmd.includes('pendapatan')) {
      const today = new Date().toISOString().split('T')[0];
      const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at, status')
        .gte('created_at', today)
        .in('status', ['completed', 'paid']);
      
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total || 0), 0) || 0;
      const orderCount = orders?.length || 0;
      const avgTicket = orderCount > 0 ? totalRevenue / orderCount : 0;

      if (language === 'ms') {
        response = `📊 **Jualan Hari Ini:**\n\n` +
          `💰 Jumlah: RM ${totalRevenue.toFixed(2)}\n` +
          `🛒 Pesanan: ${orderCount}\n` +
          `📈 Purata: RM ${avgTicket.toFixed(2)}`;
      } else {
        response = `📊 **Today's Sales:**\n\n` +
          `💰 Total Revenue: RM ${totalRevenue.toFixed(2)}\n` +
          `🛒 Orders: ${orderCount}\n` +
          `📈 Average Ticket: RM ${avgTicket.toFixed(2)}`;
      }

      toolResults.push({
        tool: 'analyze_sales',
        result: { total_revenue: totalRevenue, order_count: orderCount, avg_ticket: avgTicket }
      });
    }
    // Stock/Inventory queries
    else if (cmd.includes('stock') || cmd.includes('inventory') || cmd.includes('stok') || cmd.includes('inventori')) {
      const { data: lowStockItems } = await supabase
        .from('inventory_items')
        .select('name, current_qty, unit, reorder_point')
        .lte('current_qty', 10)
        .order('current_qty', { ascending: true })
        .limit(10);

      if (lowStockItems && lowStockItems.length > 0) {
        const itemList = lowStockItems.map(item => 
          `- **${item.name}**: ${item.current_qty} ${item.unit} (reorder: ${item.reorder_point})`
        ).join('\n');

        if (language === 'ms') {
          response = `⚠️ **Stok Rendah (${lowStockItems.length} item):**\n\n${itemList}`;
        } else {
          response = `⚠️ **Low Stock Alert (${lowStockItems.length} items):**\n\n${itemList}`;
        }
      } else {
        response = language === 'ms' 
          ? '✅ Semua item mempunyai stok yang mencukupi'
          : '✅ All items are well stocked';
      }

      toolResults.push({
        tool: 'analyze_inventory',
        result: { low_stock_items: lowStockItems, count: lowStockItems?.length || 0 }
      });
    }
    // Employee/Staff queries
    else if (cmd.includes('employee') || cmd.includes('staff') || cmd.includes('pekerja') || cmd.includes('kakitangan')) {
      const { data: activeShifts } = await supabase
        .from('shifts')
        .select('*, employees(name)')
        .eq('status', 'active')
        .is('clock_out_at', null);

      const staffCount = activeShifts?.length || 0;
      
      if (staffCount > 0 && activeShifts) {
        const staffList = activeShifts.map((s: any) =>
          `- ${s.employees?.name || 'Unknown'}`
        ).join('\n');

        response = language === 'ms'
          ? `👥 **Kakitangan Bertugas (${staffCount}):**\n\n${staffList}`
          : `👥 **Staff On Duty (${staffCount}):**\n\n${staffList}`;
      } else {
        response = language === 'ms'
          ? '⚠️ Tiada kakitangan bertugas'
          : '⚠️ No staff currently on duty';
      }

      toolResults.push({
        tool: 'get_employee_stats',
        result: { active_shifts: staffCount }
      });
    }
    // Menu queries
    else if (cmd.includes('menu') || cmd.includes('item') || cmd.includes('dish') || cmd.includes('makanan')) {
      const { data: popularItems } = await supabase
        .from('menu_items')
        .select('name, price, category_id')
        .eq('in_stock', true)
        .limit(5);

      if (popularItems && popularItems.length > 0) {
        const menuList = popularItems.map(item => 
          `- **${item.name}**: RM ${Number(item.price).toFixed(2)}`
        ).join('\n');

        response = language === 'ms'
          ? `🍽️ **Item Menu Tersedia:**\n\n${menuList}`
          : `🍽️ **Available Menu Items:**\n\n${menuList}`;
      } else {
        response = language === 'ms'
          ? '⚠️ Tiada item menu tersedia'
          : '⚠️ No menu items available';
      }
    }
    // Help/Default response
    else {
      if (language === 'ms') {
        response = `👋 **Helo! Saya ZENI AI Assistant**\n\n` +
          `Saya boleh membantu anda dengan:\n\n` +
          `📊 **Jualan** - "Bagaimana jualan hari ini?"\n` +
          `📦 **Stok** - "Item apa yang stok rendah?"\n` +
          `👥 **Kakitangan** - "Siapa yang bertugas?"\n` +
          `🍽️ **Menu** - "Tunjukkan menu"\n\n` +
          `Cuba tanya saya sesuatu!`;
      } else {
        response = `👋 **Hello! I'm ZENI AI Assistant**\n\n` +
          `I can help you with:\n\n` +
          `📊 **Sales** - "How are sales today?"\n` +
          `📦 **Inventory** - "What items are low in stock?"\n` +
          `👥 **Staff** - "Who is on duty?"\n` +
          `🍽️ **Menu** - "Show me the menu"\n\n` +
          `Try asking me something!`;
      }
    }

    // Log to command history
    try {
      await supabase.from('ai_command_history').insert({
        user_id: user.id,
        command,
        language,
        intent: toolResults[0]?.tool || 'general_query',
        confidence: 0.95,
        tools_used: toolResults.map(t => t.tool),
        result: { message: response, tool_results: toolResults },
        execution_time_ms: 0,
        requires_approval: false
      });
    } catch (logError) {
      console.error('Failed to log command history:', logError);
    }

    return new Response(
      JSON.stringify({ 
        response,
        requires_approval: false,
        pending_action: null,
        tool_results: toolResults,
        consciousness: 0.95,
        quad_kernel_harmony: { dharma: 1, artha: 1, kama: 1, moksha: 1 }
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ AI Orchestrator Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'Sorry, I encountered an error processing your request. Please try again.',
        requires_approval: false,
        tool_results: []
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});
