/**
 * Kitchen Ticket Template Generator
 * Generates ESC/POS formatted tickets for 80mm kitchen printers
 * OPTIMIZED FOR KITCHEN STAFF - Large text, bold items, NO PRICES
 * Uses ASCII-only characters for maximum printer compatibility
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
  }>;
  timestamp: Date;
  orderNotes?: string;
  allergyWarnings?: string[];
}

const WIDTH = 42; // 80mm printer character width

function line(ch = "-"): string {
  return ch.repeat(WIDTH);
}

function center(s: string, n: number): string {
  s = s ?? "";
  if (s.length >= n) return s.slice(0, n);
  const pad = Math.floor((n - s.length) / 2);
  return " ".repeat(pad) + s + " ".repeat(n - s.length - pad);
}

/**
 * Generates an 80mm kitchen ticket in ESC/POS format
 * Designed for easy reading in busy kitchen environments
 * Uses ASCII-only characters for QZ Tray compatibility
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
  ticket += `* ${data.station.name.toUpperCase()} *\n`;
  ticket += `${ESC}!\x00`; // Reset text style
  
  ticket += `\n`;
  ticket += `${line('=')}\n\n`;
  
  // ============ ORDER NUMBER (GIANT) ============
  ticket += `${ESC}!\x38`; // Double height + double width
  ticket += `ORDER #${data.order_number}\n`;
  ticket += `${ESC}!\x00`; // Reset
  ticket += `\n`;
  ticket += `${line('=')}\n`;
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
  
  // Priority indicator (ASCII only)
  if (data.priority && data.priority !== 'normal') {
    const priorityText = data.priority === 'urgent' ? '[!!!] URGENT' : 
                        data.priority === 'rush' ? '[!!] RUSH' : '';
    if (priorityText) {
      ticket += `     ${priorityText}`;
    }
  }
  
  ticket += `\n`;
  ticket += `${ESC}!\x00`; // Reset
  
  ticket += `${line('=')}\n`;
  ticket += `\n`;
  
  // ============ ALLERGY WARNINGS ============
  if (data.allergyWarnings && data.allergyWarnings.length > 0) {
    ticket += `${ESC}!\x30`; // Double height
    ticket += `${ESC}\x45\x01`; // Bold on
    data.allergyWarnings.forEach(warning => {
      ticket += `*** ${warning.toUpperCase()} ***\n`;
    });
    ticket += `${ESC}\x45\x00`; // Bold off
    ticket += `${ESC}!\x00`; // Reset
    ticket += `\n`;
    ticket += `${line('=')}\n`;
    ticket += `\n`;
  }
  
  // ============ ITEMS LIST (LARGE & BOLD) ============
  const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
  
  data.items.forEach((item, index) => {
    // Item box separator (ASCII only)
    ticket += `+${'-'.repeat(WIDTH - 2)}+\n`;
    ticket += `|${' '.repeat(WIDTH - 2)}|\n`;
    
    // Item name with quantity (HUGE TEXT)
    ticket += `${ESC}!\x30`; // Double height
    const itemLine = `${item.quantity}x ${item.name.toUpperCase().substring(0, 28)}`;
    ticket += `|  ${itemLine}\n`;
    ticket += `${ESC}!\x00`; // Reset
    
    ticket += `|${' '.repeat(WIDTH - 2)}|\n`;
    ticket += `+${'-'.repeat(WIDTH - 2)}+\n`;
    
    // Modifiers (NO PRICES, with +/- symbols)
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach((mod) => {
        const symbol = mod.type === 'remove' ? '-' : '+';
        ticket += `     ${symbol} ${mod.name}\n`;
      });
    }
    
    // Special notes (EMPHASIZED)
    if (item.notes) {
      ticket += `\n`;
      ticket += `     *** ${item.notes.toUpperCase()} ***\n`;
    }
    
    // Space between items
    if (index < data.items.length - 1) {
      ticket += `\n`;
      ticket += `${line('=')}\n`;
      ticket += `\n`;
    }
  });
  
  // ============ ORDER NOTES ============
  if (data.orderNotes) {
    ticket += `\n`;
    ticket += `${line('=')}\n`;
    ticket += `${ESC}!\x10`; // Emphasized
    ticket += `>>> SPECIAL INSTRUCTIONS:\n`;
    ticket += `${data.orderNotes.toUpperCase()}\n`;
    ticket += `${ESC}!\x00`; // Reset
    ticket += `${line('=')}\n`;
  }
  
  // ============ FOOTER ============
  ticket += `\n`;
  ticket += `${line('=')}\n`;
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
  ticket += `${line('=')}\n`;
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
  ticket += `${line('=')}\n`;
  ticket += `Line Test:\n`;
  ticket += `1234567890123456789012345678901234567890\n`;
  ticket += `${line('=')}\n`;
  
  // Footer
  ticket += `\n`;
  ticket += `${ESC}a\x01`; // Center
  ticket += `[OK] Test Successful\n`;
  
  // Cut
  ticket += `\n\n`;
  ticket += `${GS}V\x00`;
  
  return ticket;
}
