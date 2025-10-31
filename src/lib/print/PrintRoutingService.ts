import { supabase } from '@/integrations/supabase/client';
import { printService } from './PrintService';

export class PrintRoutingService {
  /**
   * Route order to appropriate stations and trigger prints
   */
  static async routeOrder(orderId: string) {
    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
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
      console.error('Order not found:', orderError);
      return;
    }
    
    // Group items by station based on routing rules
    const stationGroups = await this.groupItemsByStation(order.order_items);
    
    // For each station, print ticket to assigned printers
    for (const [stationId, items] of Object.entries(stationGroups)) {
      await this.printToStation(stationId, {
        order_id: order.id,
        order_number: order.id.substring(0, 8).toUpperCase(),
        items: items,
        order_type: order.order_type,
        table_id: order.table_id,
        timestamp: new Date(order.created_at)
      });
    }
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
    const { data: stationDevices } = await supabase
      .from('station_devices')
      .select(`
        *,
        device:devices (
          id,
          name,
          ip_address,
          device_capabilities,
          status
        ),
        station:stations (
          name,
          color
        )
      `)
      .eq('station_id', stationId)
      .eq('role', 'printer');
    
    if (!stationDevices || stationDevices.length === 0) {
      console.warn(`No printers found for station ${stationId}`);
      return;
    }
    
    // Filter online printers
    const onlinePrinters = stationDevices.filter(sd => 
      sd.device && sd.device.status === 'online'
    );
    
    if (onlinePrinters.length === 0) {
      console.warn(`No online printers for station ${stationId}`);
      return;
    }
    
    // Print to primary printer (or first if no primary)
    const primaryPrinter = onlinePrinters.find(sd => sd.is_primary);
    const printersToPrint = primaryPrinter ? [primaryPrinter] : [onlinePrinters[0]];
    
    for (const sd of printersToPrint) {
      try {
        // Generate kitchen ticket
        const ticket = {
          ...ticketData,
          station: sd.station.name.toUpperCase()
        };
        
        // Send to printer
        await printService.print80mm(ticket);
        
        console.log(`✅ Printed to ${sd.device.name}`);
      } catch (error) {
        console.error(`❌ Failed to print to ${sd.device.name}:`, error);
        
        // Log failure for monitoring
        await supabase.from('device_health_log').insert({
          device_id: sd.device.id,
          status: 'error',
          error_message: `Print failed: ${error.message}`
        });
      }
    }
  }
}
