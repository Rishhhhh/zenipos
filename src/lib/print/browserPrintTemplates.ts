/**
 * Browser-printable HTML templates optimized for thermal printers
 * These templates work with standard Windows print dialog
 */

export interface TestPageData {
  deviceName: string;
  role: string;
  station?: string;
  ipAddress?: string;
  printerName?: string;
}

export interface ReceiptData {
  orderNumber: string;
  timestamp: Date;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  restaurantName?: string;
  address?: string;
  cashier?: string;
}

export interface KitchenTicketData {
  stationName: string;
  stationIcon?: string;
  orderNumber: string;
  timestamp: Date;
  items: Array<{ 
    name: string; 
    quantity: number; 
    notes?: string; 
    modifiers?: Array<{ name: string; type?: 'add' | 'remove' }>;
    prepTime?: number;
  }>;
  tableLabel?: string;
  orderType?: string;
  priority?: 'normal' | 'rush' | 'urgent';
  notes?: string;
  allergyWarnings?: string[];
}

/**
 * Generate a test page HTML for printer verification
 * SIMPLIFIED FOR THERMAL PRINTERS - Plain text format
 */
export function generateTestPageHTML(data: TestPageData): string {
  const lines: string[] = [];

  lines.push('PRINTER TEST PAGE');
  lines.push('==============================', '');
  lines.push(`Device : ${data.deviceName}`);
  lines.push(`Role   : ${data.role}`);
  if (data.station)     lines.push(`Station: ${data.station}`);
  if (data.ipAddress)   lines.push(`IP     : ${data.ipAddress}`);
  if (data.printerName) lines.push(`Printer: ${data.printerName}`);
  lines.push('');
  lines.push('------------------------------');
  lines.push('If you can read this clearly,');
  lines.push('your printer is working properly.');
  lines.push('------------------------------', '');
  lines.push('##############################');
  lines.push('..............................');
  lines.push('******************************');
  lines.push('------------------------------', '');
  lines.push(`Test Time: ${new Date().toLocaleString()}`, '');
  lines.push('Powered by ZeniPOS');

  const content = lines.join('\n');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Printer Test</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        
        @media print {
          body { 
            margin: 0; 
            padding: 0;
            width: 80mm;
            max-width: 80mm;
          }
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.3;
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          padding: 4px;
          white-space: pre;
        }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `;
}

/**
 * Generate 58mm receipt HTML for browser printing
 */
export function generate58mmReceiptHTML(data: ReceiptData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt ${data.orderNumber}</title>
      <style>
        @page {
          size: 58mm auto;
          margin: 0;
        }
        
        @media print {
          body { 
            margin: 0; 
            padding: 0;
            width: 58mm;
            max-width: 58mm;
          }
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.3;
          width: 58mm;
          max-width: 58mm;
          margin: 0 auto;
          padding: 5px;
        }
        h2 { text-align: center; margin: 8px 0; font-size: 14px; }
        .center { text-align: center; font-size: 10px; margin: 3px 0; }
        hr { border: 1px dashed #000; margin: 5px 0; }
        .item { display: flex; justify-content: space-between; margin: 3px 0; }
        .summary { display: flex; justify-content: space-between; margin: 3px 0; }
        .total { font-weight: bold; font-size: 13px; margin: 8px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 5px 0; }
        .footer { text-align: center; margin-top: 10px; font-size: 10px; }
      </style>
    </head>
    <body>
      <h2>${data.restaurantName || 'Restaurant'}</h2>
      <div class="center">${data.address || ''}</div>
      
      <hr/>
      
      <div class="summary">
        <span>Order #${data.orderNumber}</span>
      </div>
      <div class="center">${data.timestamp.toLocaleString()}</div>
      ${data.cashier ? `<div class="center">Cashier: ${data.cashier}</div>` : ''}
      
      <hr/>
      
      ${data.items.map(item => `
        <div class="item">
          <span>${item.quantity}x ${item.name}</span>
          <span>RM${item.price.toFixed(2)}</span>
        </div>
      `).join('')}
      
      <hr/>
      
      <div class="summary">
        <span>Subtotal:</span>
        <span>RM${data.subtotal.toFixed(2)}</span>
      </div>
      <div class="summary">
        <span>Tax (6%):</span>
        <span>RM${data.tax.toFixed(2)}</span>
      </div>
      
      <div class="total">
        <div style="display: flex; justify-content: space-between;">
          <span>TOTAL:</span>
          <span>RM${data.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="summary">
        <span>Payment:</span>
        <span>${data.paymentMethod || 'Cash'}</span>
      </div>
      
      <hr/>
      
      <div class="footer">
        Thank you for your visit!<br/>
        Powered by ZeniPOS
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate 80mm kitchen ticket HTML for browser printing
 * ENHANCED FOR READABILITY - Bold headers, clear sections
 */
export function generate80mmKitchenTicketHTML(data: KitchenTicketData): string {
  const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const time = data.timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const date = data.timestamp.toLocaleDateString('en-GB');

  const priorityLabel =
    data.priority === 'urgent' ? '!!! URGENT !!!' :
    data.priority === 'rush'   ? '** RUSH **'   : '';

  const lines: string[] = [];

  // Station header
  lines.push('================================');
  lines.push(`     ${data.stationName.toUpperCase()}`);
  lines.push('================================');
  lines.push('');
  
  // Table number - MAIN HEADER (LARGE and BOLD)
  if (data.tableLabel) {
    lines.push(`TABLE: ${data.tableLabel}`);
    lines.push('');
  }

  // Order number - smaller, secondary
  lines.push(`#${data.orderNumber}`);
  lines.push('');

  // DateTime and order type
  lines.push(`${date} ${time}`);
  lines.push(`Order Type: ${(data.orderType || 'Dine in').toUpperCase()}`);
  
  if (priorityLabel) {
    lines.push('');
    lines.push(priorityLabel);
  }
  
  lines.push('................................');
  lines.push('');

  // Allergy warnings - BOLD and prominent
  if (data.allergyWarnings && data.allergyWarnings.length > 0) {
    lines.push('!!! ALLERGY WARNING !!!');
    data.allergyWarnings.forEach(w =>
      lines.push(`>>> ${w.toUpperCase()} <<<`)
    );
    lines.push('................................');
    lines.push('');
  }

  // Items - BOLD quantities and item names
  for (const item of data.items) {
    lines.push(`${item.quantity} x ${item.name.toUpperCase()}`);
    
    // Modifiers with clear prefix
    if (item.modifiers?.length) {
      for (const mod of item.modifiers) {
        const prefix = mod.type === 'remove' ? '  - NO' : '  +';
        lines.push(`${prefix} ${mod.name}`);
      }
    }

    // Special notes - HIGHLIGHTED
    if (item.notes) {
      lines.push(`  * ${item.notes.toUpperCase()} *`);
    }

    lines.push(''); // spacing between items
  }

  // Order-level notes - BOLD section
  if (data.notes) {
    lines.push('................................');
    lines.push('SPECIAL INSTRUCTIONS:');
    lines.push(`>>> ${data.notes.toUpperCase()} <<<`);
    lines.push('................................');
    lines.push('');
  }

  lines.push('================================');
  lines.push(`TOTAL ITEMS: ${totalItems}`);
  lines.push(`Printed: ${new Date().toLocaleTimeString()}`);
  lines.push('================================');

  const content = lines.join('\n');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Kitchen Ticket ${data.orderNumber}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        
        @media print {
          body { 
            margin: 0; 
            padding: 0;
            width: 80mm;
            max-width: 80mm;
          }
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          padding: 5mm;
          white-space: pre-wrap;
        }
        
        /* Make specific lines bold using line number targeting */
        body::before {
          content: '';
          display: block;
        }
      </style>
    </head>
    <body><strong>${content.replace(/\n(={32}.*?={32})\n/g, '\n</strong>$1<strong>\n')
                          .replace(/\n(TABLE: .*?)\n/g, '\n<span style="font-size: 20px; font-weight: bold;">$1</span>\n')
                          .replace(/\n(#[A-Z0-9-]+)\n/g, '\n<span style="font-size: 12px;">$1</span>\n')
                          .replace(/\n(\d+ x .*?)\n/g, '\n<strong style="font-size: 13px;">$1</strong>\n')
                          .replace(/\n(!!! .*? !!!)\n/g, '\n<strong style="font-size: 14px;">$1</strong>\n')
                          .replace(/\n(\*\* .*? \*\*)\n/g, '\n<strong style="font-size: 13px;">$1</strong>\n')
                          .replace(/\n(SPECIAL INSTRUCTIONS:)\n/g, '\n<strong>$1</strong>\n')
                          .replace(/\n(TOTAL ITEMS: .*?)\n/g, '\n<strong style="font-size: 13px;">$1</strong>\n')}</strong></body>
    </html>
  `;
}
