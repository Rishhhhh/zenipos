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
 */
export function generateTestPageHTML(data: TestPageData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Printer Test</title>
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          @page { margin: 5mm; size: 80mm auto; }
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          max-width: 80mm;
          margin: 0 auto;
          padding: 8px;
        }
        h1 { 
          text-align: center; 
          font-size: 16px; 
          border-top: 2px solid #000; 
          border-bottom: 2px solid #000; 
          padding: 6px 0; 
          margin: 8px 0;
        }
        .info-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 10px 0; 
        }
        .info-table td { 
          padding: 4px 8px; 
          border-bottom: 1px solid #ddd; 
          font-size: 11px;
        }
        .info-table td:first-child { 
          font-weight: bold; 
          width: 40%;
        }
        hr { border: 1px dashed #000; margin: 10px 0; }
        .success { 
          text-align: center; 
          font-weight: bold; 
          margin: 12px 0; 
          padding: 8px; 
          border: 2px solid #000; 
          font-size: 12px;
        }
        .pattern { 
          text-align: center; 
          font-size: 14px; 
          line-height: 1.2; 
          margin: 10px 0; 
          letter-spacing: 0;
        }
        .footer { 
          text-align: center; 
          font-size: 10px; 
          margin-top: 15px; 
          color: #666; 
        }
      </style>
    </head>
    <body>
      <h1>PRINTER TEST PAGE</h1>
      
      <table class="info-table">
        <tr>
          <td>Device:</td>
          <td>${data.deviceName}</td>
        </tr>
        <tr>
          <td>Role:</td>
          <td>${data.role}</td>
        </tr>
        ${data.station ? `<tr><td>Station:</td><td>${data.station}</td></tr>` : ''}
        ${data.ipAddress ? `<tr><td>IP Address:</td><td>${data.ipAddress}</td></tr>` : ''}
        ${data.printerName ? `<tr><td>Printer Name:</td><td>${data.printerName}</td></tr>` : ''}
      </table>
      
      <hr/>
      
      <div class="success">
        ✓ If you can read this clearly,<br/>
        your printer is working correctly!
      </div>
      
      <hr/>
      
      <div style="text-align: center; font-size: 12px; margin: 8px 0;">
        <strong>Print Quality Test</strong>
      </div>
      
      <div class="pattern">
        ████████████████████████████████<br/>
        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓<br/>
        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒<br/>
        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░<br/>
        ════════════════════════════════
      </div>
      
      <hr/>
      
      <table class="info-table">
        <tr>
          <td>Test Time:</td>
          <td>${new Date().toLocaleString()}</td>
        </tr>
      </table>
      
      <div class="footer">
        Powered by ZeniPOS
      </div>
    </body>
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
        @media print {
          body { margin: 0; padding: 0; }
          @page { margin: 5mm; size: 58mm auto; }
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.3;
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
 * SIMPLIFIED FOR THERMAL PRINTERS - Clean, compact layout
 */
export function generate80mmKitchenTicketHTML(data: KitchenTicketData): string {
  const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const stationIcon = data.stationIcon || '🍳';
  const priorityConfig = {
    urgent: { label: 'RUSH', marker: '🔴' },
    rush: { label: 'RUSH', marker: '🟡' },
    normal: { label: 'NORMAL', marker: '' }
  };
  const priority = priorityConfig[data.priority || 'normal'];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Kitchen Ticket ${data.orderNumber}</title>
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          @page { margin: 5mm; size: 80mm auto; }
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.3;
          max-width: 80mm;
          margin: 0 auto;
          padding: 5mm;
          color: #000;
        }
        
        /* Station Header */
        .station-header {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        
        /* Order Number Box */
        .order-number {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          border: 2px solid #000;
          padding: 6px;
          margin: 8px 0;
        }
        
        /* Order Info Table */
        .order-info {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
          font-size: 11px;
        }
        .order-info td {
          padding: 4px 6px;
          border: 1px solid #000;
          text-align: center;
        }
        .order-info td strong {
          display: block;
          font-size: 10px;
          color: #666;
        }
        
        hr {
          border: none;
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        
        /* Item Display */
        .item {
          margin: 10px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #ddd;
          page-break-inside: avoid;
        }
        .item:last-child {
          border-bottom: none;
        }
        .item-name {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        /* Quantity Display */
        .quantity {
          font-size: 11px;
          margin: 4px 0;
        }
        .quantity span {
          font-family: monospace;
          letter-spacing: 2px;
        }
        
        /* Modifiers */
        .modifiers {
          margin: 4px 0 4px 12px;
          font-size: 11px;
        }
        .modifier-item {
          margin: 2px 0;
        }
        .modifier-add { color: #000; }
        .modifier-add:before { content: '+ '; }
        .modifier-remove { color: #000; }
        .modifier-remove:before { content: '- '; }
        
        /* Special Notes */
        .special-note {
          background: #f0f0f0;
          border: 1px solid #000;
          padding: 6px;
          margin: 4px 0;
          font-size: 11px;
          font-weight: bold;
        }
        
        /* Prep Time */
        .prep-time {
          font-size: 10px;
          color: #666;
          margin-top: 4px;
        }
        
        /* Order Notes */
        .order-notes {
          background: #f0f0f0;
          border: 2px solid #000;
          padding: 8px;
          margin: 8px 0;
          font-size: 11px;
          font-weight: bold;
        }
        
        /* Allergy Warning */
        .allergy-warning {
          background: #000;
          color: #fff;
          padding: 8px;
          margin: 8px 0;
          font-size: 12px;
          font-weight: bold;
          text-align: center;
        }
        
        /* Footer */
        .footer {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          margin: 12px 0 8px 0;
          padding: 8px;
          border: 2px solid #000;
        }
        
        .print-time {
          text-align: center;
          font-size: 10px;
          color: #666;
          margin-top: 8px;
        }
      </style>
    </head>
    <body>
      <!-- Station Header -->
      <div class="station-header">
        ${stationIcon} ${data.stationName}
      </div>
      
      <!-- Order Number -->
      <div class="order-number">
        ORDER #${data.orderNumber}
      </div>
      
      <!-- Order Info Table -->
      <table class="order-info">
        <tr>
          <td>
            <strong>Time</strong>
            ${data.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </td>
          ${data.tableLabel ? `
            <td>
              <strong>Table</strong>
              ${data.tableLabel}
            </td>
          ` : ''}
          <td>
            <strong>Type</strong>
            ${data.orderType?.toUpperCase() || 'DINE-IN'}
            ${priority.marker ? ` ${priority.marker}` : ''}
          </td>
        </tr>
      </table>
      
      <!-- Allergy Warnings -->
      ${data.allergyWarnings && data.allergyWarnings.length > 0 ? `
        ${data.allergyWarnings.map(warning => `
          <div class="allergy-warning">
            ⚠️ ${warning.toUpperCase()} ⚠️
          </div>
        `).join('')}
      ` : ''}
      
      <hr/>
      
      <!-- Items -->
      ${data.items.map(item => `
        <div class="item">
          <div class="item-name">
            ${item.quantity}X ${item.name.toUpperCase()}
          </div>
          
          <div class="quantity">
            QTY: <span>${Array.from({ length: item.quantity }, () => '[ ]').join(' ')}</span>
          </div>
          
          ${item.modifiers && item.modifiers.length > 0 ? `
            <div class="modifiers">
              ${item.modifiers.map(mod => `
                <div class="modifier-item ${mod.type === 'remove' ? 'modifier-remove' : 'modifier-add'}">
                  ${mod.name}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${item.notes ? `
            <div class="special-note">
              ⚠️ ${item.notes.toUpperCase()}
            </div>
          ` : ''}
          
          ${item.prepTime ? `
            <div class="prep-time">
              ⏱️ Prep Time: ~${item.prepTime} min
            </div>
          ` : ''}
        </div>
      `).join('')}
      
      ${data.notes ? `
        <hr/>
        <div class="order-notes">
          📝 SPECIAL INSTRUCTIONS:<br/>
          ${data.notes.toUpperCase()}
        </div>
      ` : ''}
      
      <hr/>
      
      <!-- Footer -->
      <div class="footer">
        TOTAL ITEMS: ${totalItems}
      </div>
      
      <div class="print-time">
        Printed: ${new Date().toLocaleTimeString()}
      </div>
    </body>
    </html>
  `;
}
