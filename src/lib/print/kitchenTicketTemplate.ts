/**
 * Kitchen Ticket Template Generator
 * Generates ESC/POS formatted tickets for 80mm kitchen printers
 */

export interface KitchenTicketData {
  station: {
    name: string;
    color: string;
  };
  order_number: string;
  table_label?: string;
  order_type: string;
  items: Array<{
    name: string;
    quantity: number;
    modifiers?: Array<{
      name: string;
      price?: number;
    }>;
    notes?: string;
  }>;
  timestamp: Date;
}

/**
 * Generates an 80mm kitchen ticket in ESC/POS format
 */
export function generateKitchenTicket(data: KitchenTicketData): string {
  // ESC/POS control commands
  const ESC = '\x1B';
  const GS = '\x1D';
  
  let ticket = '';
  
  // Initialize printer
  ticket += `${ESC}@`; // Reset printer
  ticket += `${ESC}a\x01`; // Center align
  
  // Station header (large, bold)
  ticket += `${ESC}!\x38`; // Double height + double width + emphasized
  ticket += `${data.station.name.toUpperCase()}\n`;
  ticket += `${ESC}!\x00`; // Reset text style
  ticket += `${ESC}a\x00`; // Left align
  
  // Separator
  ticket += `\n`;
  ticket += `${'='.repeat(42)}\n`;
  
  // Order information
  ticket += `${ESC}!\x10`; // Emphasized
  ticket += `Order: #${data.order_number}\n`;
  ticket += `${ESC}!\x00`; // Reset
  
  if (data.table_label) {
    ticket += `Table: ${data.table_label}\n`;
  }
  
  ticket += `Type: ${data.order_type}\n`;
  ticket += `Time: ${data.timestamp.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })}\n`;
  
  // Separator
  ticket += `${'='.repeat(42)}\n`;
  ticket += `\n`;
  
  // Items list
  data.items.forEach((item, index) => {
    // Item name with quantity (large text)
    ticket += `${ESC}!\x20`; // Double height
    ticket += `${item.quantity}x ${item.name}\n`;
    ticket += `${ESC}!\x00`; // Reset
    
    // Modifiers (indented)
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach((mod) => {
        ticket += `   + ${mod.name}`;
        if (mod.price && mod.price > 0) {
          ticket += ` (+$${mod.price.toFixed(2)})`;
        }
        ticket += `\n`;
      });
    }
    
    // Special notes (emphasized, indented)
    if (item.notes) {
      ticket += `${ESC}!\x08`; // Small text
      ticket += `   ** ${item.notes.toUpperCase()} **\n`;
      ticket += `${ESC}!\x00`; // Reset
    }
    
    // Space between items
    if (index < data.items.length - 1) {
      ticket += `\n`;
    }
  });
  
  // Bottom separator
  ticket += `\n`;
  ticket += `${'='.repeat(42)}\n`;
  
  // Timestamp footer
  ticket += `${ESC}a\x01`; // Center align
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
