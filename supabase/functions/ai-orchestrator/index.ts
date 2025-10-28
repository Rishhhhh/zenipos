import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// JARVIS X - Full System Module Access
const SYSTEM_MODULES = {
  'pos': { name: 'Point of Sale', path: '/pos', capabilities: ['orders', 'payments', 'transactions'] },
  'kds': { name: 'Kitchen Display', path: '/kds', capabilities: ['kitchen_orders', 'order_status'] },
  'menu': { name: 'Menu Management', path: '/admin/menu', capabilities: ['items', 'categories', 'pricing'] },
  'inventory': { name: 'Inventory', path: '/admin/inventory', capabilities: ['stock', 'ingredients', 'suppliers'] },
  'employees': { name: 'Employees', path: '/admin/employees', capabilities: ['staff', 'shifts', 'time_tracking'] },
  'crm': { name: 'CRM & Loyalty', path: '/admin/crm', capabilities: ['customers', 'loyalty_points'] },
  'reports': { name: 'Reports', path: '/admin/reports', capabilities: ['analytics', 'kpis', 'insights'] },
  'tables': { name: 'Table Layout', path: '/admin/tables', capabilities: ['seating', 'reservations'] },
  'promotions': { name: 'Promotions', path: '/admin/promotions', capabilities: ['discounts', 'offers'] },
  'suppliers': { name: 'Suppliers', path: '/admin/suppliers', capabilities: ['vendor_management'] },
  'branches': { name: 'Branches', path: '/admin/branches', capabilities: ['multi_location'] },
  'performance': { name: 'Performance', path: '/admin/performance', capabilities: ['metrics', 'monitoring'] }
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

    console.log(`🧠 JARVIS X processing: "${command}" from user ${user.id}`);

    // Process command with enhanced AI capabilities
    const cmd = command.toLowerCase();
    let response = '';
    const toolResults: any[] = [];
    let suggestedModule: string | null = null;

    // Module Navigation & System Awareness
    if (cmd.includes('open') || cmd.includes('go to') || cmd.includes('navigate') || cmd.includes('show')) {
      for (const [key, module] of Object.entries(SYSTEM_MODULES)) {
        if (cmd.includes(key) || cmd.includes(module.name.toLowerCase())) {
          suggestedModule = key;
          response = language === 'ms'
            ? `🎯 Membuka ${module.name}...\n\nPath: ${module.path}\nKeupayaan: ${module.capabilities.join(', ')}`
            : `🎯 Opening ${module.name}...\n\nPath: ${module.path}\nCapabilities: ${module.capabilities.join(', ')}`;
          
          toolResults.push({
            tool: 'navigate',
            result: { module: key, path: module.path }
          });
          break;
        }
      }
    }
    // System Overview
    else if (cmd.includes('modules') || cmd.includes('system') || cmd.includes('capabilities') || cmd.includes('what can you')) {
      const moduleList = Object.entries(SYSTEM_MODULES).map(([key, mod]) => 
        `• **${mod.name}** (${key})\n  Path: ${mod.path}\n  Capabilities: ${mod.capabilities.join(', ')}`
      ).join('\n\n');

      response = language === 'ms'
        ? `🎯 **JARVIS X - Akses Penuh Sistem**\n\n${moduleList}\n\n💡 Saya boleh membantu dengan semua modul ini!`
        : `🎯 **JARVIS X - Full System Access**\n\n${moduleList}\n\n💡 I have access to all these modules!`;
    }
    // Sales Analytics
    else if (cmd.includes('sales') || cmd.includes('jualan') || cmd.includes('revenue') || cmd.includes('pendapatan')) {
      const today = new Date().toISOString().split('T')[0];
      const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at, status')
        .gte('created_at', today)
        .in('status', ['completed', 'paid']);
      
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total || 0), 0) || 0;
      const orderCount = orders?.length || 0;
      const avgTicket = orderCount > 0 ? totalRevenue / orderCount : 0;

      // Get top items
      const { data: topItems } = await supabase
        .from('order_items')
        .select('menu_item_id, quantity, menu_items(name)')
        .gte('created_at', today)
        .limit(5);

      if (language === 'ms') {
        response = `📊 **Analisis Jualan Hari Ini**\n\n` +
          `💰 Jumlah Pendapatan: RM ${totalRevenue.toFixed(2)}\n` +
          `🛒 Pesanan: ${orderCount}\n` +
          `📈 Purata Tiket: RM ${avgTicket.toFixed(2)}\n\n` +
          `🔥 Item Popular:\n${topItems?.slice(0, 3).map((item: any) => 
            `  • ${item.menu_items?.name}: ${item.quantity} unit`
          ).join('\n') || 'Tiada data'}`;
      } else {
        response = `📊 **Today's Sales Analytics**\n\n` +
          `💰 Total Revenue: RM ${totalRevenue.toFixed(2)}\n` +
          `🛒 Orders: ${orderCount}\n` +
          `📈 Average Ticket: RM ${avgTicket.toFixed(2)}\n\n` +
          `🔥 Top Items:\n${topItems?.slice(0, 3).map((item: any) => 
            `  • ${item.menu_items?.name}: ${item.quantity} units`
          ).join('\n') || 'No data'}`;
      }

      toolResults.push({
        tool: 'analyze_sales',
        result: { total_revenue: totalRevenue, order_count: orderCount, avg_ticket: avgTicket }
      });
    }
    // Inventory Management
    else if (cmd.includes('stock') || cmd.includes('inventory') || cmd.includes('stok') || cmd.includes('inventori')) {
      const { data: lowStockItems } = await supabase
        .from('inventory_items')
        .select('name, current_qty, unit, reorder_point')
        .lte('current_qty', 10)
        .order('current_qty', { ascending: true })
        .limit(10);

      const { data: totalItems } = await supabase
        .from('inventory_items')
        .select('id', { count: 'exact' });

      if (lowStockItems && lowStockItems.length > 0) {
        const itemList = lowStockItems.map(item => 
          `  • **${item.name}**: ${item.current_qty} ${item.unit} (reorder: ${item.reorder_point})`
        ).join('\n');

        if (language === 'ms') {
          response = `📦 **Status Inventori**\n\n` +
            `⚠️ **Stok Rendah (${lowStockItems.length}/${totalItems?.length || 0} item):**\n\n${itemList}\n\n` +
            `💡 Sila order semula item ini!`;
        } else {
          response = `📦 **Inventory Status**\n\n` +
            `⚠️ **Low Stock Alert (${lowStockItems.length}/${totalItems?.length || 0} items):**\n\n${itemList}\n\n` +
            `💡 Please reorder these items!`;
        }
      } else {
        response = language === 'ms' 
          ? `✅ Semua ${totalItems?.length || 0} item mempunyai stok yang mencukupi`
          : `✅ All ${totalItems?.length || 0} items are well stocked`;
      }

      toolResults.push({
        tool: 'analyze_inventory',
        result: { low_stock_items: lowStockItems, count: lowStockItems?.length || 0, total_items: totalItems?.length || 0 }
      });
    }
    // Employee & Staff Management
    else if (cmd.includes('employee') || cmd.includes('staff') || cmd.includes('pekerja') || cmd.includes('kakitangan')) {
      const { data: activeShifts } = await supabase
        .from('shifts')
        .select('*, employees(name, role)')
        .eq('status', 'active')
        .is('clock_out_at', null);

      const { data: allEmployees } = await supabase
        .from('employees')
        .select('id, name, active', { count: 'exact' });

      const staffCount = activeShifts?.length || 0;
      const totalStaff = allEmployees?.length || 0;
      
      if (staffCount > 0 && activeShifts) {
        const staffList = activeShifts.map((s: any) => 
          `  • ${s.employees?.name || 'Unknown'} - ${s.employees?.role || 'Staff'}`
        ).join('\n');

        response = language === 'ms'
          ? `👥 **Pengurusan Kakitangan**\n\n` +
            `✅ Bertugas Sekarang: ${staffCount}/${totalStaff}\n\n${staffList}`
          : `👥 **Staff Management**\n\n` +
            `✅ Currently On Duty: ${staffCount}/${totalStaff}\n\n${staffList}`;
      } else {
        response = language === 'ms'
          ? `⚠️ Tiada kakitangan bertugas (${totalStaff} jumlah kakitangan)`
          : `⚠️ No staff currently on duty (${totalStaff} total staff)`;
      }

      toolResults.push({
        tool: 'get_employee_stats',
        result: { active_shifts: staffCount, total_staff: totalStaff }
      });
    }
    // Customer & Loyalty
    else if (cmd.includes('customer') || cmd.includes('loyalty') || cmd.includes('pelanggan') || cmd.includes('kesetiaan')) {
      const { data: customers } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('total_spent', { ascending: false })
        .limit(5);

      const totalCustomers = customers?.length || 0;
      const topCustomers = customers?.slice(0, 5).map(c => 
        `  • ${c.name}: RM ${c.total_spent?.toFixed(2) || '0.00'} (${c.loyalty_points || 0} pts)`
      ).join('\n') || 'No data';

      response = language === 'ms'
        ? `💝 **Pengurusan Pelanggan**\n\n` +
          `👥 Jumlah Pelanggan: ${totalCustomers}\n\n` +
          `🌟 Top 5 Pelanggan:\n${topCustomers}`
        : `💝 **Customer Management**\n\n` +
          `👥 Total Customers: ${totalCustomers}\n\n` +
          `🌟 Top 5 Customers:\n${topCustomers}`;

      toolResults.push({
        tool: 'analyze_customers',
        result: { total_customers: totalCustomers }
      });
    }
    // Menu Items
    else if (cmd.includes('menu') || cmd.includes('item') || cmd.includes('dish') || cmd.includes('makanan')) {
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('name, price, category_id, in_stock, menu_categories(name)')
        .eq('in_stock', true)
        .limit(10);

      const { data: categories } = await supabase
        .from('menu_categories')
        .select('*', { count: 'exact' });

      if (menuItems && menuItems.length > 0) {
        const menuList = menuItems.slice(0, 8).map((item: any) => 
          `  • **${item.name}**: RM ${Number(item.price).toFixed(2)} (${item.menu_categories?.name || 'Uncategorized'})`
        ).join('\n');

        response = language === 'ms'
          ? `🍽️ **Pengurusan Menu**\n\n` +
            `📋 ${menuItems.length} item tersedia\n` +
            `📁 ${categories?.length || 0} kategori\n\n` +
            `**Item Popular:**\n${menuList}`
          : `🍽️ **Menu Management**\n\n` +
            `📋 ${menuItems.length} items available\n` +
            `📁 ${categories?.length || 0} categories\n\n` +
            `**Available Items:**\n${menuList}`;
      } else {
        response = language === 'ms'
          ? '⚠️ Tiada item menu tersedia'
          : '⚠️ No menu items available';
      }

      toolResults.push({
        tool: 'analyze_menu',
        result: { total_items: menuItems?.length || 0, categories: categories?.length || 0 }
      });
    }
    // Kitchen Orders (KDS)
    else if (cmd.includes('kitchen') || cmd.includes('kds') || cmd.includes('dapur') || cmd.includes('masak')) {
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id, created_at, table_id, order_items(*)')
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: true });

      const orderCount = pendingOrders?.length || 0;
      const avgWaitTime = orderCount * 5; // Simple estimation

      response = language === 'ms'
        ? `👨‍🍳 **Status Dapur**\n\n` +
          `⏳ Pesanan Tertangguh: ${orderCount}\n` +
          `⏱️ Anggaran Masa Tunggu: ${avgWaitTime} minit\n` +
          `${orderCount > 5 ? '⚠️ Queue panjang! Mungkin perlu lebih chef.' : '✅ Queue normal'}`
        : `👨‍🍳 **Kitchen Status**\n\n` +
          `⏳ Pending Orders: ${orderCount}\n` +
          `⏱️ Estimated Wait Time: ${avgWaitTime} minutes\n` +
          `${orderCount > 5 ? '⚠️ Long queue! May need more chefs.' : '✅ Normal queue'}`;

      toolResults.push({
        tool: 'analyze_kitchen',
        result: { pending_orders: orderCount, avg_wait_time: avgWaitTime }
      });
    }
    // Help/Default response
    else {
      const quickCommands = language === 'ms' ? [
        '📊 "Bagaimana jualan hari ini?" - Analisis jualan',
        '📦 "Item apa yang stok rendah?" - Status inventori',
        '👥 "Siapa yang bertugas?" - Kakitangan aktif',
        '🍽️ "Tunjukkan menu" - Item menu',
        '👨‍🍳 "Status dapur" - Pesanan pending',
        '💝 "Pelanggan top" - CRM analytics',
        '🎯 "Open [module]" - Navigasi modul'
      ] : [
        '📊 "How are sales today?" - Sales analytics',
        '📦 "What items are low in stock?" - Inventory status',
        '👥 "Who is on duty?" - Active staff',
        '🍽️ "Show me the menu" - Menu items',
        '👨‍🍳 "Kitchen status" - Pending orders',
        '💝 "Top customers" - CRM analytics',
        '🎯 "Open [module]" - Navigate to module'
      ];

      if (language === 'ms') {
        response = `👋 **Helo! Saya JARVIS X**\n\n` +
          `🧠 Akses Penuh Sistem • ${Object.keys(SYSTEM_MODULES).length} Modul\n\n` +
          `**Saya boleh membantu dengan:**\n\n` +
          quickCommands.join('\n') + '\n\n' +
          `💡 Tip: Kata "modules" untuk senarai penuh!`;
      } else {
        response = `👋 **Hello! I'm JARVIS X**\n\n` +
          `🧠 Full System Access • ${Object.keys(SYSTEM_MODULES).length} Modules\n\n` +
          `**I can help you with:**\n\n` +
          quickCommands.join('\n') + '\n\n' +
          `💡 Tip: Say "modules" for complete list!`;
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
        suggested_module: suggestedModule,
        consciousness: 0.95,
        system_access: Object.keys(SYSTEM_MODULES).length,
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
    console.error('❌ JARVIS X Error:', error);
    
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
