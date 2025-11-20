/**
 * Kitchen Ticket Template Generator
 * Generates ESC/POS formatted tickets for 80mm kitchen printers
 * OPTIMIZED FOR KITCHEN STAFF - Large text, bold items, NO PRICES
 */

export interface KitchenTicketData {
  station: {
    name: string;
    color: string;
    icon?: string;
  };
  order_number: string;
  table_label?: string;
  order_type: string;
  priority?: 'normal' | 'rush' | 'urgent';
  items: Array<{
    name: string;
    quantity: number;
    modifiers?: Array<{
      name: string;
      type?: 'add' | 'remove';
    }>;
    notes?: string;
    prepTime?: number;
  }>;
  timestamp: Date;
  orderNotes?: string;
  allergyWarnings?: string[];
}

/**
 * Generates an 80mm kitchen ticket in ESC/POS format
 * Designed for easy reading in busy kitchen environments
 */
export function generateKitchenTicket(data: KitchenTicketData): string {
  // ESC/POS control commands
  const ESC = '\x1B';
  const GS = '\x1D';
  
  let ticket = '';
  
  // Initialize printer
  ticket += `${ESC}@`; // Reset printer
  
  // ============ STATION HEADER (HUGE) ============
  ticket += `${ESC}a\x01`; // Center align
  ticket += `${ESC}!\x38`; // Double height + double width + emphasized
  const stationIcon = data.station.icon || '🍳';
  ticket += `${stationIcon} ${data.station.name.toUpperCase()}\n`;
  ticket += `${ESC}!\x00`; // Reset text style
  
  ticket += `\n`;
  ticket += `${'='.repeat(42)}\n\n`;
  
  // ============ ORDER NUMBER (GIANT) ============
  ticket += `${ESC}!\x38`; // Double height + double width
  ticket += `ORDER #${data.order_number}\n`;
  ticket += `${ESC}!\x00`; // Reset
  ticket += `\n`;
  ticket += `${'='.repeat(42)}\n`;
  ticket += `${ESC}a\x00`; // Left align
  
  // ============ ORDER INFO ============
  ticket += `${ESC}!\x10`; // Emphasized
  
  if (data.table_label) {
    ticket += `Table: ${data.table_label}`;
    ticket += `     Time: ${data.timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}\n`;
  } else {
    ticket += `Time: ${data.timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}\n`;
  }
  
  ticket += `Type: ${data.order_type.toUpperCase()}`;
  
  // Priority indicator
  if (data.priority) {
    const priorityIcon = data.priority === 'urgent' ? '🔴' : 
                        data.priority === 'rush' ? '🟡' : '⚪';
    ticket += `     ${priorityIcon} ${data.priority.toUpperCase()}`;
  }
  
  ticket += `\n`;
  ticket += `${ESC}!\x00`; // Reset
  
  ticket += `${'='.repeat(42)}\n`;
  ticket += `\n`;
  
  // ============ ALLERGY WARNINGS (RED ALERT) ============
  if (data.allergyWarnings && data.allergyWarnings.length > 0) {
    ticket += `${ESC}!\x30`; // Double height
    ticket += `${ESC}\x45\x01`; // Bold on
    data.allergyWarnings.forEach(warning => {
      ticket += `⚠️  ${warning.toUpperCase()}  ⚠️\n`;
    });
    ticket += `${ESC}\x45\x00`; // Bold off
    ticket += `${ESC}!\x00`; // Reset
    ticket += `\n`;
    ticket += `${'='.repeat(42)}\n`;
    ticket += `\n`;
  }
  
  // ============ ITEMS LIST (LARGE & BOLD) ============
  const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
  
  data.items.forEach((item, index) => {
    // Item box separator
    ticket += `┏${'━'.repeat(40)}┓\n`;
    ticket += `┃${' '.repeat(40)}┃\n`;
    
    // Item name with quantity (HUGE TEXT)
    ticket += `${ESC}!\x30`; // Double height
    ticket += `┃  QTY: ${item.quantity}x  ${item.name.toUpperCase().substring(0, 25)}\n`;
    ticket += `${ESC}!\x00`; // Reset
    
    // Quantity checkboxes
    ticket += `┃          `;
    for (let i = 0; i < item.quantity; i++) {
      ticket += `[☐] `;
    }
    ticket += `\n`;
    
    ticket += `┃${' '.repeat(40)}┃\n`;
    ticket += `┗${'━'.repeat(40)}┛\n`;
    
    // Modifiers (NO PRICES, with +/- symbols)
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach((mod) => {
        const symbol = mod.type === 'remove' ? '➖' : '➕';
        ticket += `     ${symbol} ${mod.name}\n`;
      });
    }
    
    // Special notes (EMPHASIZED)
    if (item.notes) {
      ticket += `\n`;
      ticket += `     ⚠️  ${item.notes.toUpperCase()}  ⚠️\n`;
    }
    
    // Prep time if available
    if (item.prepTime) {
      ticket += `     ⏱️  Prep: ~${item.prepTime} min\n`;
    }
    
    // Space between items
    if (index < data.items.length - 1) {
      ticket += `\n`;
      ticket += `${'═'.repeat(42)}\n`;
      ticket += `\n`;
    }
  });
  
  // ============ ORDER NOTES ============
  if (data.orderNotes) {
    ticket += `\n`;
    ticket += `${'='.repeat(42)}\n`;
    ticket += `${ESC}!\x10`; // Emphasized
    ticket += `📝 SPECIAL INSTRUCTIONS:\n`;
    ticket += `${data.orderNotes.toUpperCase()}\n`;
    ticket += `${ESC}!\x00`; // Reset
    ticket += `${'='.repeat(42)}\n`;
  }
  
  // ============ FOOTER ============
  ticket += `\n`;
  ticket += `${'='.repeat(42)}\n`;
  ticket += `${ESC}a\x01`; // Center align
  ticket += `${ESC}!\x10`; // Emphasized
  ticket += `TOTAL ITEMS: ${totalItems}\n`;
  ticket += `${ESC}!\x00`; // Reset
  ticket += `\n`;
  ticket += `Printed: ${new Date().toLocaleTimeString()}\n`;
  ticket += `${ESC}a\x00`; // Left align
  
  // Feed and cut
  ticket += `\n\n\n`;
  ticket += `${GS}V\x00`; // Full cut
  
  return ticket;
}

/**
 * Generate a simple test ticket for printer testing
 */
export function generateTestTicket(printerName: string, stationName: string): string {
  const ESC = '\x1B';
  const GS = '\x1D';
  
  let ticket = '';
  
  // Initialize
  ticket += `${ESC}@`;
  ticket += `${ESC}a\x01`; // Center
  
  // Header
  ticket += `${ESC}!\x38`; // Large
  ticket += `TEST PRINT\n`;
  ticket += `${ESC}!\x00`;
  
  ticket += `\n`;
  ticket += `${'='.repeat(42)}\n`;
  ticket += `${ESC}a\x00`; // Left align
  
  // Info
  ticket += `Printer: ${printerName}\n`;
  ticket += `Station: ${stationName}\n`;
  ticket += `Time: ${new Date().toLocaleString()}\n`;
  
  ticket += `\n`;
  ticket += `This is a test print to verify\n`;
  ticket += `printer connectivity and formatting.\n`;
  
  // Test patterns
  ticket += `\n`;
  ticket += `${'='.repeat(42)}\n`;
  ticket += `Line Test:\n`;
  ticket += `1234567890123456789012345678901234567890\n`;
  ticket += `${'='.repeat(42)}\n`;
  
  // Footer
  ticket += `\n`;
  ticket += `${ESC}a\x01`; // Center
  ticket += `✓ Test Successful\n`;
  
  // Cut
  ticket += `\n\n`;
  ticket += `${GS}V\x00`;
  
  return ticket;
}
