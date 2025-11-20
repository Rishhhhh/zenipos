import { supabase } from '@/integrations/supabase/client';
import { printService } from './PrintService';
import { generateKitchenTicket } from './kitchenTicketTemplate';

export class PrintRoutingService {
  /**
   * Route order to appropriate stations and trigger prints
   */
  static async routeOrder(orderId: string) {
    console.log(`📋 Starting print routing for order ${orderId}`);
    
    // Get order with items and table
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        tables (
          label
        ),
        order_items (
          *,
          menu_items (
            id,
            name,
            category_id
          )
        )
      `)
      .eq('id', orderId)
      .single();
    
    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      return;
    }
    
    // Group items by station based on routing rules
    const stationGroups = await this.groupItemsByStation(order.order_items);
    
    console.log(`🔀 Order routed to ${Object.keys(stationGroups).length} stations`);
    
    // For each station, print ticket to assigned printers
    for (const [stationId, items] of Object.entries(stationGroups)) {
      await this.printToStation(stationId, {
        order_id: order.id,
        order_number: order.id.substring(0, 8).toUpperCase(),
        items: items,
        order_type: order.order_type,
        table_label: order.tables?.label,
        timestamp: new Date(order.created_at)
      });
    }
    
    console.log(`✅ Print routing completed for order ${orderId}`);
  }
  
  /**
   * Group order items by station based on routing rules
   */
  private static async groupItemsByStation(orderItems: any[]) {
    const groups: Record<string, any[]> = {};
    
    for (const item of orderItems) {
      // Check for item-specific routing rule
      let { data: rules } = await supabase
        .from('station_routing_rules')
        .select('station_id, stations(name, color)')
        .eq('menu_item_id', item.menu_items.id)
        .limit(1);
      
      // If no item rule, check category rule
      if (!rules || rules.length === 0) {
        const { data: categoryRules } = await supabase
          .from('station_routing_rules')
          .select('station_id, stations(name, color)')
          .eq('category_id', item.menu_items.category_id)
          .limit(1);
        rules = categoryRules;
      }
      
      // Use first station found, or skip if no routing
      const stationId = rules?.[0]?.station_id;
      
      if (!stationId) {
        console.warn(`No routing rule found for item ${item.menu_items.name}`);
        continue;
      }
      
      if (!groups[stationId]) {
        groups[stationId] = [];
      }
      
      groups[stationId].push({
        name: item.menu_items.name,
        quantity: item.quantity,
        notes: item.notes,
        modifiers: item.modifiers
      });
    }
    
    return groups;
  }
  
  /**
   * Print ticket to station's assigned printers
   */
  private static async printToStation(stationId: string, ticketData: any) {
    // Get station details and assigned printers
    const { data: station } = await supabase
      .from('stations')
      .select('name, color')
      .eq('id', stationId)
      .single();

    if (!station) {
      console.warn(`⚠️  Station ${stationId} not found`);
      return;
    }

    const { data: devices } = await supabase
      .from('devices')
      .select('*')
      .eq('station_id', stationId)
      .eq('role', 'PRINTER');
    
    if (!devices || devices.length === 0) {
      console.warn(`⚠️  No printers configured for station ${station.name}`);
      return;
    }
    
    // Filter online printers
    const onlinePrinters = devices.filter(device => 
      device && device.status === 'online'
    );
    
    if (onlinePrinters.length === 0) {
      console.warn(`⚠️  No online printers for station ${station.name}`);
      console.log(`   Offline printers: ${devices.map(d => d.name).join(', ')}`);
      return;
    }
    
    // Print to first available online printer
    const printer = onlinePrinters[0];
    
    console.log(`🖨️  Printing to ${printer.name} (${printer.ip_address || 'no IP'})`);
    
    try {
      // Generate kitchen ticket using template
      const ticketESCPOS = generateKitchenTicket({
        station: {
          name: station.name,
          color: station.color || '#8B5CF6'
        },
        order_number: ticketData.order_number,
        table_label: ticketData.table_label,
        order_type: ticketData.order_type,
        items: ticketData.items,
        timestamp: ticketData.timestamp
      });
      
      // Send to printer
      if (printer.ip_address) {
        await printService.printRaw(printer.ip_address, ticketESCPOS);
      } else {
        // Fallback to console log if no IP
        console.log(ticketESCPOS);
      }
      
      console.log(`✅ Successfully printed to ${printer.name}`);
      
      // Log success
      await supabase.from('device_health_log').insert({
        device_id: printer.id,
        status: 'online',
        metadata: { order_id: ticketData.order_id, action: 'print_success' }
      });
      
    } catch (error: any) {
      console.error(`❌ Print failed for ${printer.name}:`, error);
      
      // Log failure for monitoring
      await supabase.from('device_health_log').insert({
        device_id: printer.id,
        status: 'error',
        error_message: `Print failed: ${error.message}`,
        metadata: { order_id: ticketData.order_id }
      });
    }
  }
}
