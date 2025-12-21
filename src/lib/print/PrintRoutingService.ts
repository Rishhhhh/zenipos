import { supabase } from '@/integrations/supabase/client';
import { printService } from './PrintService';
import { generateKitchenTicket } from './kitchenTicketTemplate';
import { generateKitchenTicket58mm } from './kitchenTicket58mm';
import { qzPrintReceiptEscpos, getConfiguredPrinterName } from './qzEscposReceipt';
import { getCashDrawerSettings } from '@/lib/hardware/cashDrawer';

/**
 * Station icon mapping for different kitchen areas
 */
const STATION_ICONS: Record<string, string> = {
  'HOT KITCHEN': '🍳',
  'KITCHEN': '🍳',
  'GRILL': '🔥',
  'FRY': '🍟',
  'BAR': '🍹',
  'DRINKS': '🍹',
  'SALAD': '🥗',
  'COLD PREP': '🥗',
  'DESSERTS': '🍰',
  'PASTRY': '🍰',
  'EXPO': '📋',
  'DEFAULT': '🍽️'
};

/**
 * Get station icon based on station name
 */
function getStationIcon(stationName: string): string {
  const upperName = stationName.toUpperCase();
  for (const [key, icon] of Object.entries(STATION_ICONS)) {
    if (upperName.includes(key)) {
      return icon;
    }
  }
  return STATION_ICONS.DEFAULT;
}

/**
 * Detect order priority based on order type and notes
 */
function detectPriority(orderType: string, notes?: string): 'normal' | 'rush' | 'urgent' {
  const notesLower = notes?.toLowerCase() || '';
  
  if (notesLower.includes('urgent') || notesLower.includes('emergency')) {
    return 'urgent';
  }
  
  if (notesLower.includes('rush') || orderType.toLowerCase() === 'takeaway' || orderType.toLowerCase() === 'delivery') {
    return 'rush';
  }
  
  return 'normal';
}

/**
 * Extract allergy warnings from order items
 */
function extractAllergyWarnings(items: any[]): string[] {
  const warnings = new Set<string>();
  
  items.forEach(item => {
    const notes = item.notes?.toLowerCase() || '';
    
    // Common allergen keywords
    const allergens = ['allerg', 'peanut', 'nut', 'dairy', 'lactose', 'gluten', 'shellfish', 'seafood', 'egg', 'soy'];
    
    allergens.forEach(allergen => {
      if (notes.includes(allergen)) {
        // Extract the full sentence or phrase containing the allergen
        const sentences = item.notes.split(/[.!]/);
        sentences.forEach((sentence: string) => {
          if (sentence.toLowerCase().includes(allergen)) {
            warnings.add(sentence.trim());
          }
        });
      }
    });
  });
  
  return Array.from(warnings);
}

export class PrintRoutingService {
  /**
   * Generate kitchen ticket HTML for browser printing
   */
  private static async generateKitchenTicketHTML(ticketData: any, stationName: string): Promise<string> {
    const { generate80mmKitchenTicketHTML } = await import('./browserPrintTemplates');
    
    const stationIcon = getStationIcon(stationName);
    const priority = detectPriority(ticketData.order_type);
    const allergyWarnings = extractAllergyWarnings(ticketData.items);
    
    return generate80mmKitchenTicketHTML({
      stationName,
      stationIcon,
      orderNumber: ticketData.order_number,
      timestamp: ticketData.timestamp,
      items: ticketData.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        notes: item.notes,
        modifiers: item.modifiers?.map((mod: any) => ({
          name: mod.name,
          type: mod.price && mod.price < 0 ? 'remove' : 'add'
        })),
        prepTime: item.prepTime
      })),
      tableLabel: ticketData.table_label,
      orderType: ticketData.order_type,
      priority,
      allergyWarnings: allergyWarnings.length > 0 ? allergyWarnings : undefined
    });
  }
  
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
        tables!table_id (
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
    
    console.log('📋 Order fetch result:', { order, error: orderError });
    
    if (orderError || !order) {
      console.error('❌ Order fetch failed:', orderError);
      return;
    }
    
    // Group items by station based on routing rules
    const stationGroups = await this.groupItemsByStation(order.order_items);
    
    console.log(`🔀 Order routed to ${Object.keys(stationGroups).length} stations`);
    
    // Detect priority and allergy warnings
    const priority = detectPriority(order.order_type);
    const allergyWarnings = extractAllergyWarnings(order.order_items);
    
    // For each station, print ticket to assigned printers
    for (const [stationId, items] of Object.entries(stationGroups)) {
      await this.printToStation(stationId, {
        order_id: order.id,
        order_number: order.id.substring(0, 8).toUpperCase(),
        items: items,
        order_type: order.order_type,
        table_label: order.tables?.label,
        timestamp: new Date(order.created_at),
        priority,
        allergyWarnings: allergyWarnings.length > 0 ? allergyWarnings : undefined
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
        modifiers: item.modifiers,
        prepTime: item.prep_time_actual
      });
    }
    
    return groups;
  }
  
  /**
   * Print ticket to station's assigned printers
   * Priority: QZ Tray ESC/POS > Network Print > Browser Print
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

    // PRIORITY 1: Try QZ Tray ESC/POS printing first
    const qzPrinter = getConfiguredPrinterName();
    if (qzPrinter) {
      try {
        const settings = getCashDrawerSettings();
        const paperSize = settings.paperSize || '80mm';
        
        const ticketParams = {
          station: {
            name: station.name,
            color: station.color || '#8B5CF6',
          },
          order_number: ticketData.order_number,
          table_label: ticketData.table_label,
          order_type: ticketData.order_type,
          priority: ticketData.priority,
          items: ticketData.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            notes: item.notes,
            modifiers: item.modifiers?.map((mod: any) => ({
              name: mod.name,
              type: mod.price && mod.price < 0 ? 'remove' : 'add'
            })),
          })),
          timestamp: ticketData.timestamp,
          orderNotes: undefined,
          allergyWarnings: ticketData.allergyWarnings
        };

        // Use appropriate template based on paper size
        const ticketText = paperSize === '58mm'
          ? generateKitchenTicket58mm(ticketParams)
          : generateKitchenTicket(ticketParams);

        await qzPrintReceiptEscpos({
          printerName: qzPrinter,
          receiptText: ticketText,
          cut: true,
          openDrawer: false,
        });

        console.log(`✅ Kitchen ticket printed via QZ Tray (${paperSize}) to ${qzPrinter}`);
        return; // Success, no fallback needed
      } catch (qzError) {
        console.warn('⚠️ QZ Tray print failed, trying other methods:', qzError);
      }
    }

    // PRIORITY 2 & 3: Network print or browser fallback
    const { data: devices } = await supabase
      .from('devices')
      .select('*')
      .eq('station_id', stationId)
      .eq('role', 'PRINTER');
    
    if (!devices || devices.length === 0) {
      console.warn(`⚠️  No printers configured for station ${station.name}, using browser fallback`);
      const { BrowserPrintService } = await import('./BrowserPrintService');
      const html = await this.generateKitchenTicketHTML(ticketData, station.name);
      await BrowserPrintService.printHTML(html);
      return;
    }
    
    // Filter online printers
    const onlinePrinters = devices.filter(device => 
      device && device.status === 'online'
    );
    
    if (onlinePrinters.length === 0) {
      console.warn(`⚠️  No online printers for station ${station.name}, using browser fallback`);
      const { BrowserPrintService } = await import('./BrowserPrintService');
      const html = await this.generateKitchenTicketHTML(ticketData, station.name);
      await BrowserPrintService.printHTML(html, devices[0].id, devices[0].name);
      return;
    }
    
    // Print to first available online printer
    const printer = onlinePrinters[0];
    
    console.log(`🖨️  Printing to ${printer.name} (${printer.ip_address || 'no IP'})`);
    
    try {
      // Try network print first if IP is configured
      if (printer.ip_address) {
        try {
          // Generate ESC/POS ticket based on paper size
          const settings = getCashDrawerSettings();
          const paperSize = settings.paperSize || '80mm';
          
          const ticketParams = {
            station: {
              name: station.name,
              color: station.color || '#8B5CF6',
            },
            order_number: ticketData.order_number,
            table_label: ticketData.table_label,
            order_type: ticketData.order_type,
            priority: ticketData.priority,
            items: ticketData.items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              notes: item.notes,
              modifiers: item.modifiers?.map((mod: any) => ({
                name: mod.name,
                type: mod.price && mod.price < 0 ? 'remove' : 'add'
              })),
            })),
            timestamp: ticketData.timestamp,
            orderNotes: undefined,
            allergyWarnings: ticketData.allergyWarnings
          };
          
          const ticketESCPOS = paperSize === '58mm'
            ? generateKitchenTicket58mm(ticketParams)
            : generateKitchenTicket(ticketParams);
          
          await printService.printRaw(printer.ip_address, ticketESCPOS);
          
          console.log(`✅ Successfully printed to ${printer.name} (network)`);
          
          // Update last_seen timestamp on successful print
          await supabase
            .from('devices')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', printer.id);
          
          // Log success
          await supabase.from('device_health_log').insert({
            device_id: printer.id,
            status: 'online',
            metadata: { 
              order_id: ticketData.order_id, 
              action: 'print_success',
              method: 'network',
              priority: ticketData.priority
            }
          });
        } catch (networkError) {
          console.warn('⚠️  Network print failed, falling back to browser print:', networkError);
          
          // Fallback to browser print
          const { BrowserPrintService } = await import('./BrowserPrintService');
          const html = await this.generateKitchenTicketHTML(ticketData, station.name);
          await BrowserPrintService.printHTML(html, printer.id, printer.name);
          
          console.log(`✅ Ticket printed via browser dialog for ${printer.name}`);
        }
      } else {
        // No IP configured, use browser print directly
        const { BrowserPrintService } = await import('./BrowserPrintService');
        const html = await this.generateKitchenTicketHTML(ticketData, station.name);
        await BrowserPrintService.printHTML(html, printer.id, printer.name);
        
        // Update last_seen timestamp on successful browser print
        await supabase
          .from('devices')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', printer.id);
        
        console.log(`✅ Ticket printed via browser dialog for ${printer.name}`);
      }
    } catch (error) {
      console.error(`❌ Print failed for ${printer.name}:`, error);
      
      // Log error
      await supabase.from('device_health_log').insert({
        device_id: printer.id,
        status: 'error',
        error_message: error instanceof Error ? error.message : String(error),
        metadata: { order_id: ticketData.order_id, action: 'print_error' }
      });
    }
  }
}
