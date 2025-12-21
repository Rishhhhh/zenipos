/**
 * Kitchen Ticket Template Generator for 58mm printers
 * Compact format for narrow thermal paper rolls
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

const WIDTH = 32; // 58mm printer character width

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
 * Generates a 58mm kitchen ticket in ESC/POS format
 * Compact design for narrow paper rolls
 */
export function generateKitchenTicket58mm(data: KitchenTicketData): string {
  const ESC = '\x1B';
  const GS = '\x1D';
  
  let ticket = '';
  
  // Initialize printer with smaller font
  ticket += `${ESC}@`; // Reset printer
  ticket += `${ESC}M\x01`; // Select Font B (smaller)
  
  // ============ STATION HEADER ============
  ticket += `${ESC}a\x01`; // Center align
  ticket += `${ESC}!\x30`; // Double height
  ticket += `${data.station.name.toUpperCase()}\n`;
  ticket += `${ESC}!\x00`; // Reset text style
  
  ticket += `${line('=')}\n`;
  
  // ============ ORDER NUMBER ============
  ticket += `${ESC}!\x30`; // Double height
  ticket += `#${data.order_number}\n`;
  ticket += `${ESC}!\x00`; // Reset
  ticket += `${line('=')}\n`;
  ticket += `${ESC}a\x00`; // Left align
  
  // ============ ORDER INFO (compact) ============
  const timeStr = data.timestamp.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  
  if (data.table_label) {
    ticket += `T:${data.table_label} ${timeStr}\n`;
  } else {
    ticket += `Time: ${timeStr}\n`;
  }
  
  ticket += `${data.order_type.toUpperCase()}`;
  
  // Priority indicator
  if (data.priority && data.priority !== 'normal') {
    const priorityText = data.priority === 'urgent' ? ' [!!!]' : ' [!!]';
    ticket += priorityText;
  }
  ticket += `\n`;
  
  ticket += `${line('-')}\n`;
  
  // ============ ALLERGY WARNINGS ============
  if (data.allergyWarnings && data.allergyWarnings.length > 0) {
    ticket += `${ESC}!\x10`; // Emphasized
    data.allergyWarnings.forEach(warning => {
      ticket += `! ${warning.toUpperCase()}\n`;
    });
    ticket += `${ESC}!\x00`; // Reset
    ticket += `${line('-')}\n`;
  }
  
  // ============ ITEMS LIST ============
  const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
  
  data.items.forEach((item, index) => {
    // Item with quantity
    ticket += `${ESC}!\x10`; // Emphasized
    const itemName = item.name.toUpperCase().substring(0, 20);
    ticket += `${item.quantity}x ${itemName}\n`;
    ticket += `${ESC}!\x00`; // Reset
    
    // Checkboxes (compact)
    let checkboxes = '   ';
    for (let i = 0; i < Math.min(item.quantity, 5); i++) {
      checkboxes += '[ ]';
    }
    ticket += `${checkboxes}\n`;
    
    // Modifiers
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach((mod) => {
        const symbol = mod.type === 'remove' ? '-' : '+';
        const modName = mod.name.substring(0, 25);
        ticket += `  ${symbol}${modName}\n`;
      });
    }
    
    // Special notes
    if (item.notes) {
      ticket += `  *${item.notes.toUpperCase()}*\n`;
    }
    
    if (index < data.items.length - 1) {
      ticket += `${line('-')}\n`;
    }
  });
  
  // ============ ORDER NOTES ============
  if (data.orderNotes) {
    ticket += `${line('-')}\n`;
    ticket += `NOTE:\n`;
    ticket += `${data.orderNotes.toUpperCase()}\n`;
  }
  
  // ============ FOOTER ============
  ticket += `${line('=')}\n`;
  ticket += `${ESC}a\x01`; // Center
  ticket += `ITEMS: ${totalItems}\n`;
  ticket += `${new Date().toLocaleTimeString()}\n`;
  ticket += `${ESC}a\x00`; // Left
  
  // Feed and cut
  ticket += `\n\n`;
  ticket += `${GS}V\x00`; // Full cut
  
  return ticket;
}
