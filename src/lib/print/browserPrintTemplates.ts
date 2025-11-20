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
 * OPTIMIZED FOR KITCHEN STAFF - Large text, bold items, NO PRICES
 */
export function generate80mmKitchenTicketHTML(data: KitchenTicketData): string {
  const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const stationIcon = data.stationIcon || '🍳';
  const priorityConfig = {
    urgent: { icon: '🔴', color: '#ff0000', label: 'RUSH' },
    rush: { icon: '🟡', color: '#ff9800', label: 'RUSH' },
    normal: { icon: '⚪', color: '#666', label: 'NORMAL' }
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
          font-family: 'Arial Black', 'Arial', sans-serif;
          font-size: 14px;
          line-height: 1.4;
          max-width: 80mm;
          margin: 0 auto;
          padding: 8px;
          color: #000;
        }
        
        /* STATION HEADER - BLACK BANNER */
        .station-header {
          background: #000;
          color: #fff;
          font-size: 28px;
          font-weight: bold;
          text-align: center;
          padding: 15px 10px;
          margin: -8px -8px 15px -8px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        /* ORDER NUMBER - GIANT BOX */
        .order-number {
          font-size: 36px;
          font-weight: bold;
          text-align: center;
          border: 4px solid #000;
          padding: 12px;
          margin: 15px 0;
          background: #fff;
          letter-spacing: 3px;
        }
        
        /* ORDER INFO */
        .order-info {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px;
          background: #f5f5f5;
          border: 2px solid #000;
          font-size: 14px;
          font-weight: bold;
        }
        .order-info-item {
          flex: 1;
        }
        .order-info-label {
          font-size: 11px;
          color: #666;
          font-weight: normal;
        }
        
        /* PRIORITY BADGE */
        .priority-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
          margin-left: 8px;
        }
        
        /* ALLERGY WARNING - RED ALERT */
        .allergy-warning {
          background: #ff0000;
          color: #fff;
          padding: 15px;
          margin: 15px 0;
          border: 4px solid #cc0000;
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.7; }
        }
        
        hr {
          border: none;
          border-top: 3px solid #000;
          margin: 15px 0;
        }
        
        /* ITEM BOX */
        .item-box {
          border: 3px solid #000;
          padding: 12px;
          margin: 15px 0;
          background: #fff;
          page-break-inside: avoid;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* ITEM NAME - HUGE & BOLD */
        .item-name {
          font-size: 24px;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0 0 8px 0;
          letter-spacing: 1px;
        }
        
        /* QUANTITY CHECKBOXES */
        .quantity-boxes {
          display: flex;
          gap: 8px;
          margin: 10px 0;
          padding: 10px;
          background: #f9f9f9;
          border: 2px dashed #666;
        }
        .checkbox {
          display: inline-block;
          width: 30px;
          height: 30px;
          border: 3px solid #000;
          background: #fff;
          text-align: center;
          line-height: 24px;
          font-size: 18px;
        }
        
        /* MODIFIERS */
        .modifiers {
          margin: 10px 0 10px 20px;
          font-size: 15px;
          font-weight: 600;
        }
        .modifier-item {
          margin: 5px 0;
          padding: 5px 0;
        }
        .modifier-add { color: #2e7d32; }
        .modifier-remove { color: #c62828; }
        
        /* SPECIAL NOTES - RED BOX */
        .special-note {
          background: #ffebee;
          border: 3px solid #ff0000;
          color: #000;
          padding: 12px;
          margin: 10px 0;
          font-weight: bold;
          font-size: 14px;
        }
        
        /* PREP TIME */
        .prep-time {
          display: inline-block;
          padding: 4px 10px;
          background: #e3f2fd;
          border: 2px solid #1976d2;
          border-radius: 4px;
          font-size: 12px;
          margin-top: 8px;
        }
        
        /* ORDER NOTES - SPECIAL INSTRUCTIONS */
        .order-notes {
          background: #fff3e0;
          border: 4px solid #ff9800;
          padding: 15px;
          margin: 15px 0;
          font-weight: bold;
          font-size: 15px;
        }
        
        /* FOOTER - TOTAL ITEMS */
        .footer {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin: 20px 0 10px 0;
          padding: 15px;
          background: #000;
          color: #fff;
          border-radius: 8px;
        }
        
        .print-time {
          text-align: center;
          font-size: 11px;
          color: #666;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <!-- STATION HEADER -->
      <div class="station-header">
        ${stationIcon} ${data.stationName}
      </div>
      
      <!-- ORDER NUMBER -->
      <div class="order-number">
        ORDER #${data.orderNumber}
      </div>
      
      <!-- ORDER INFO -->
      <div class="order-info">
        <div class="order-info-item">
          <div class="order-info-label">Time</div>
          <div>${data.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
        </div>
        ${data.tableLabel ? `
          <div class="order-info-item">
            <div class="order-info-label">Table</div>
            <div>${data.tableLabel}</div>
          </div>
        ` : ''}
        <div class="order-info-item">
          <div class="order-info-label">Type</div>
          <div>
            ${data.orderType?.toUpperCase() || 'DINE-IN'}
            ${data.priority !== 'normal' ? `<span class="priority-badge" style="background: ${priority.color}; color: #fff;">${priority.icon} ${priority.label}</span>` : ''}
          </div>
        </div>
      </div>
      
      <!-- ALLERGY WARNINGS -->
      ${data.allergyWarnings && data.allergyWarnings.length > 0 ? `
        ${data.allergyWarnings.map(warning => `
          <div class="allergy-warning">
            ⚠️ ${warning.toUpperCase()} ⚠️
          </div>
        `).join('')}
      ` : ''}
      
      <hr/>
      
      <!-- ITEMS -->
      ${data.items.map(item => `
        <div class="item-box">
          <div class="item-name">
            ${item.quantity}x ${item.name}
          </div>
          
          <!-- Quantity Checkboxes -->
          <div class="quantity-boxes">
            <strong style="margin-right: 10px;">QTY:</strong>
            ${Array.from({ length: item.quantity }, (_, i) => `<div class="checkbox">☐</div>`).join('')}
          </div>
          
          <!-- Modifiers -->
          ${item.modifiers && item.modifiers.length > 0 ? `
            <div class="modifiers">
              ${item.modifiers.map(mod => `
                <div class="modifier-item ${mod.type === 'remove' ? 'modifier-remove' : 'modifier-add'}">
                  ${mod.type === 'remove' ? '➖' : '➕'} ${mod.name}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <!-- Special Notes -->
          ${item.notes ? `
            <div class="special-note">
              ⚠️ ${item.notes.toUpperCase()}
            </div>
          ` : ''}
          
          <!-- Prep Time -->
          ${item.prepTime ? `
            <div class="prep-time">
              ⏱️ Prep Time: ~${item.prepTime} min
            </div>
          ` : ''}
        </div>
      `).join('')}
      
      <!-- ORDER NOTES -->
      ${data.notes ? `
        <hr/>
        <div class="order-notes">
          📝 <strong>SPECIAL INSTRUCTIONS:</strong><br/>
          ${data.notes.toUpperCase()}
        </div>
      ` : ''}
      
      <hr/>
      
      <!-- FOOTER -->
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
