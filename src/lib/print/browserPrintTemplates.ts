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

export interface ReceiptData80mm {
  restaurantName: string;
  address?: string;
  phone?: string;
  orderNumber: string;
  tableLabel?: string;
  orderType?: string;
  timestamp: Date;
  items: Array<{ 
    name: string; 
    quantity: number; 
    price: number;
    modifiers?: string[];
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashReceived?: number;
  changeGiven?: number;
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
 * Generate 80mm customer receipt HTML for browser printing
 * PROFESSIONAL LAYOUT - Clear sections, payment details
 */
export function generate80mmReceiptHTML(data: ReceiptData80mm): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt ${data.orderNumber}</title>
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
        }
        
        .header {
          text-align: center;
          margin-bottom: 10px;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
        }
        
        .restaurant-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .address, .phone {
          font-size: 11px;
          margin: 2px 0;
        }
        
        .order-info {
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px dashed #000;
        }
        
        .order-info div {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }
        
        .items-section {
          margin: 10px 0;
          border-bottom: 1px dashed #000;
          padding-bottom: 8px;
        }
        
        .items-header {
          font-weight: bold;
          margin-bottom: 5px;
          border-bottom: 1px solid #000;
          padding-bottom: 3px;
        }
        
        .item {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
        
        .item-details {
          flex: 1;
        }
        
        .item-price {
          text-align: right;
          min-width: 60px;
        }
        
        .modifier {
          font-size: 10px;
          margin-left: 10px;
          color: #333;
        }
        
        .totals-section {
          margin: 10px 0;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
        }
        
        .grand-total {
          font-size: 14px;
          font-weight: bold;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 8px 0;
          margin: 8px 0;
        }
        
        .payment-section {
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px dashed #000;
        }
        
        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 11px;
        }
        
        .footer-message {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="restaurant-name">${data.restaurantName}</div>
        ${data.address ? `<div class="address">${data.address}</div>` : ''}
        ${data.phone ? `<div class="phone">Tel: ${data.phone}</div>` : ''}
      </div>
      
      <div class="order-info">
        <div>
          <span>Order #:</span>
          <span><strong>${data.orderNumber}</strong></span>
        </div>
        ${data.tableLabel ? `<div><span>Table:</span><span><strong>${data.tableLabel}</strong></span></div>` : ''}
        <div>
          <span>Type:</span>
          <span>${data.orderType || 'DINE IN'}</span>
        </div>
        <div>
          <span>Date:</span>
          <span>${data.timestamp.toLocaleDateString('en-GB')}</span>
        </div>
        <div>
          <span>Time:</span>
          <span>${data.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${data.cashier ? `<div><span>Cashier:</span><span>${data.cashier}</span></div>` : ''}
      </div>
      
      <div class="items-section">
        <div class="items-header">ITEMS</div>
        ${data.items.map(item => `
          <div class="item">
            <div class="item-details">
              <div><strong>${item.quantity} x ${item.name}</strong></div>
              ${item.modifiers && item.modifiers.length > 0 ? 
                item.modifiers.map(mod => `<div class="modifier">+ ${mod}</div>`).join('') 
                : ''}
            </div>
            <div class="item-price">RM ${item.price.toFixed(2)}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="totals-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>RM ${data.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Tax (6%):</span>
          <span>RM ${data.tax.toFixed(2)}</span>
        </div>
        <div class="grand-total">
          <div class="total-row">
            <span>TOTAL:</span>
            <span>RM ${data.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div class="payment-section">
        <div class="total-row">
          <span><strong>Payment Method:</strong></span>
          <span><strong>${data.paymentMethod.toUpperCase()}</strong></span>
        </div>
        ${data.cashReceived ? `
          <div class="total-row">
            <span>Cash Received:</span>
            <span>RM ${data.cashReceived.toFixed(2)}</span>
          </div>
        ` : ''}
        ${data.changeGiven ? `
          <div class="total-row">
            <span>Change:</span>
            <span>RM ${data.changeGiven.toFixed(2)}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <div class="footer-message">================================</div>
        <div class="footer-message">Thank you for dining with us!</div>
        <div class="footer-message">Please visit us again</div>
        <div class="footer-message">================================</div>
        <div class="footer-message" style="margin-top: 10px;">Powered by ZeniPOS</div>
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
