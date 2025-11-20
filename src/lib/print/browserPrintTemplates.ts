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
  orderNumber: string;
  timestamp: Date;
  items: Array<{ name: string; quantity: number; notes?: string; modifiers?: any[] }>;
  tableLabel?: string;
  orderType?: string;
  notes?: string;
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
          @page { margin: 10mm; size: 80mm auto; }
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          max-width: 80mm;
          margin: 0 auto;
          padding: 10px;
        }
        h1, h2 { text-align: center; margin: 10px 0; }
        h1 { font-size: 18px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; }
        h2 { font-size: 14px; }
        .info { margin: 8px 0; }
        .info strong { display: inline-block; width: 100px; }
        hr { border: 1px dashed #000; margin: 10px 0; }
        .pattern { text-align: center; font-size: 16px; line-height: 1.2; margin: 15px 0; }
        .success { text-align: center; font-weight: bold; margin: 15px 0; padding: 10px; border: 2px solid #000; }
        .footer { text-align: center; font-size: 10px; margin-top: 20px; color: #666; }
      </style>
    </head>
    <body>
      <h1>🖨️ PRINTER TEST PAGE</h1>
      
      <div class="info">
        <strong>Device:</strong> ${data.deviceName}
      </div>
      <div class="info">
        <strong>Role:</strong> ${data.role}
      </div>
      ${data.station ? `<div class="info"><strong>Station:</strong> ${data.station}</div>` : ''}
      ${data.ipAddress ? `<div class="info"><strong>IP Address:</strong> ${data.ipAddress}</div>` : ''}
      ${data.printerName ? `<div class="info"><strong>Printer Name:</strong> ${data.printerName}</div>` : ''}
      
      <hr/>
      
      <div class="success">
        ✅ If you can read this clearly,<br/>
        your printer is working correctly!
      </div>
      
      <hr/>
      
      <h2>Print Quality Test Pattern</h2>
      
      <div class="pattern">
        ████████████████████████████████<br/>
        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓<br/>
        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒<br/>
        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░<br/>
        ││││││││││││││││││││││││││││││││<br/>
        ════════════════════════════════
      </div>
      
      <hr/>
      
      <div class="info">
        <strong>Test Time:</strong> ${new Date().toLocaleString()}
      </div>
      
      <div class="footer">
        Powered by ZeniPOS<br/>
        Device Management System
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
 */
export function generate80mmKitchenTicketHTML(data: KitchenTicketData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Kitchen Ticket ${data.orderNumber}</title>
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          @page { margin: 8mm; size: 80mm auto; }
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          max-width: 80mm;
          margin: 0 auto;
          padding: 10px;
        }
        h1 {
          text-align: center;
          margin: 15px 0;
          font-size: 22px;
          background: #000;
          color: #fff;
          padding: 10px;
          text-transform: uppercase;
        }
        h2 {
          text-align: center;
          margin: 10px 0;
          font-size: 18px;
          border: 2px solid #000;
          padding: 8px;
        }
        .meta {
          margin: 8px 0;
          font-size: 13px;
        }
        hr { border: 2px solid #000; margin: 12px 0; }
        .item {
          margin: 15px 0;
          page-break-inside: avoid;
        }
        .item-name {
          font-size: 20px;
          font-weight: bold;
          margin: 5px 0;
          text-transform: uppercase;
        }
        .modifiers {
          font-size: 13px;
          margin-left: 20px;
          font-style: italic;
        }
        .notes {
          font-size: 13px;
          margin-left: 20px;
          background: #f0f0f0;
          padding: 5px;
          border-left: 3px solid #000;
        }
        .summary {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <h1>🍳 ${data.stationName}</h1>
      
      <h2>Order #${data.orderNumber}</h2>
      
      <div class="meta">
        <strong>Time:</strong> ${data.timestamp.toLocaleTimeString()}
      </div>
      ${data.tableLabel ? `<div class="meta"><strong>Table:</strong> ${data.tableLabel}</div>` : ''}
      ${data.orderType ? `<div class="meta"><strong>Type:</strong> ${data.orderType.toUpperCase()}</div>` : ''}
      
      <hr/>
      
      ${data.items.map(item => `
        <div class="item">
          <div class="item-name">
            ${item.quantity}x ${item.name}
          </div>
          ${item.modifiers && item.modifiers.length > 0 ? `
            <div class="modifiers">
              ${item.modifiers.map((m: any) => `+ ${m.name}`).join('<br/>')}
            </div>
          ` : ''}
          ${item.notes ? `
            <div class="notes">
              📝 ${item.notes}
            </div>
          ` : ''}
        </div>
      `).join('')}
      
      <hr/>
      
      ${data.notes ? `
        <div style="background: #ffe6e6; padding: 10px; border: 2px solid #ff0000; margin: 10px 0;">
          <strong>⚠️ SPECIAL INSTRUCTIONS:</strong><br/>
          ${data.notes}
        </div>
        <hr/>
      ` : ''}
      
      <div class="summary">
        Total Items: ${data.items.reduce((sum, item) => sum + item.quantity, 0)}
      </div>
    </body>
    </html>
  `;
}
