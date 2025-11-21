import { Receipt, KitchenTicket } from './PrintService';

/**
 * Generate 58mm customer receipt HTML
 */
export function generate58mmReceipt(receipt: Receipt & { einvoice_enabled?: boolean }, options?: {
  restaurantName?: string;
  address?: string;
  cashier?: string;
}): string {
  const template = `
    <div style="width: 58mm; font-family: monospace; font-size: 12px;">
      <h2 style="text-align: center; margin: 10px 0;">${options?.restaurantName || 'Restaurant'}</h2>
      <p style="text-align: center; font-size: 10px;">${options?.address || ''}</p>
      <hr style="border: 1px dashed #000;">
      
      <p style="margin: 5px 0;">Order #${receipt.order_number}</p>
      <p style="margin: 5px 0;">Date: ${new Date(receipt.timestamp).toLocaleString()}</p>
      ${options?.cashier ? `<p style="margin: 5px 0;">Cashier: ${options.cashier}</p>` : ''}
      
      <hr style="border: 1px dashed #000;">
      
      ${receipt.items.map(item => `
        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
          <span>${item.quantity}x ${item.name}</span>
          <span>RM ${item.total.toFixed(2)}</span>
        </div>
      `).join('')}
      
      <hr style="border: 1px dashed #000;">
      
      <div style="display: flex; justify-content: space-between; margin: 5px 0;">
        <span>Subtotal:</span>
        <span>RM ${receipt.subtotal.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 5px 0;">
        <span>Tax (6%):</span>
        <span>RM ${receipt.tax.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 10px 0; font-weight: bold; font-size: 14px;">
        <span>Total:</span>
        <span>RM ${receipt.total.toFixed(2)}</span>
      </div>
      
      <hr style="border: 1px dashed #000;">
      
      <p style="margin: 5px 0;">Payment: ${receipt.payment_method || 'Cash'}</p>
      
      ${receipt.einvoice_enabled ? `
        <hr style="border: 1px dashed #000;">
        <div style="background: #f0f0f0; padding: 8px; margin: 5px 0; border-radius: 4px;">
          <p style="margin: 3px 0; font-weight: bold; font-size: 11px;">📄 e-Invoice: Pending</p>
          <p style="margin: 3px 0; font-size: 10px;">MyInvois submission in progress</p>
          <p style="margin: 3px 0; font-size: 10px;">QR code will be available shortly</p>
        </div>
      ` : ''}
      
      <hr style="border: 1px dashed #000;">
      
      <p style="text-align: center; margin: 10px 0;">Thank you!</p>
      <p style="text-align: center; font-size: 10px;">Powered by ZeniPOS</p>
    </div>
  `;
  
  return template;
}

/**
 * Generate 80mm kitchen ticket HTML - SIMPLIFIED FOR THERMAL PRINTERS
 */
export function generate80mmKitchenTicket(ticket: KitchenTicket): string {
  const totalItems = ticket.items.reduce((sum, item) => sum + item.quantity, 0);
  const timestamp = new Date(ticket.timestamp);
  
  const template = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
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
        }
        .station-header {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .order-number {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          border: 2px solid #000;
          padding: 6px;
          margin: 8px 0;
        }
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
        .order-info strong {
          display: block;
          font-size: 10px;
        }
        hr {
          border: none;
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        .item {
          margin: 10px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #ddd;
        }
        .item:last-child { border-bottom: none; }
        .item-name {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .quantity {
          font-size: 11px;
          margin: 4px 0;
        }
        .prep-time {
          font-size: 10px;
          color: #666;
          margin-top: 4px;
        }
        .notes {
          background: #f0f0f0;
          border: 1px solid #000;
          padding: 6px;
          margin: 4px 0;
          font-size: 11px;
        }
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
          margin-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="station-header">🍳 ${ticket.station.toUpperCase()}</div>
      
      <div class="order-number">ORDER #${ticket.order_number}</div>
      
      <table class="order-info">
        <tr>
          <td><strong>Time</strong>${timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
          <td><strong>Table</strong>T19</td>
          <td><strong>Type</strong>DINE_IN</td>
        </tr>
      </table>
      
      <hr/>
      
      ${ticket.items.map(item => `
        <div class="item">
          <div class="item-name">${item.quantity}X ${item.name.toUpperCase()}</div>
          <div class="quantity">QTY: ${Array.from({ length: item.quantity }, () => '[ ]').join(' ')}</div>
          <div class="prep-time">⏱️ Prep Time: ~600 min</div>
        </div>
      `).join('')}
      
      ${ticket.notes ? `
        <hr/>
        <div class="notes">📝 ${ticket.notes.toUpperCase()}</div>
      ` : ''}
      
      <hr/>
      
      <div class="footer">TOTAL ITEMS: ${totalItems}</div>
      
      <div class="print-time">Printed: ${timestamp.toLocaleString()}</div>
    </body>
    </html>
  `;
  
  return template;
}

/**
 * Generate drinks bar ticket HTML (80mm)
 */
export function generateDrinksTicket(ticket: KitchenTicket): string {
  // Filter for beverage items
  const drinkItems = ticket.items.filter(item => {
    const name = item.name.toLowerCase();
    return (
      name.includes('drink') ||
      name.includes('teh') ||
      name.includes('kopi') ||
      name.includes('coffee') ||
      name.includes('tea') ||
      name.includes('juice') ||
      name.includes('soda') ||
      name.includes('water') ||
      name.includes('latte') ||
      name.includes('cappuccino') ||
      name.includes('shake') ||
      name.includes('smoothie')
    );
  });

  // Return empty if no drinks
  if (drinkItems.length === 0) return '';

  // Use same template as kitchen ticket but with DRINKS BAR station
  const template = `
    <div style="width: 80mm; font-family: monospace; font-size: 16px;">
      <h1 style="text-align: center; margin: 15px 0; font-size: 24px;">🥤 DRINKS BAR</h1>
      <h2 style="text-align: center; margin: 10px 0; font-size: 20px;">Order #${ticket.order_number}</h2>
      
      <p style="margin: 10px 0;">Time: ${new Date(ticket.timestamp).toLocaleTimeString()}</p>
      
      <hr style="border: 2px solid #000;">
      
      ${drinkItems.map(item => `
        <div style="margin: 15px 0;">
          <p style="font-size: 22px; font-weight: bold; margin: 5px 0;">
            ${item.quantity}x ${item.name.toUpperCase()}
          </p>
        </div>
      `).join('')}
      
      <hr style="border: 2px solid #000;">
      
      ${ticket.notes ? `
        <p style="font-style: italic; margin: 10px 0; font-size: 14px;">
          Note: ${ticket.notes}
        </p>
      ` : ''}
      
      <p style="margin: 15px 0; font-size: 18px;">
        Total Drinks: ${drinkItems.reduce((sum, item) => sum + item.quantity, 0)}
      </p>
    </div>
  `;
  
  return template;
}

/**
 * Generate refund receipt HTML
 */
export function generateRefundReceipt(receipt: Receipt, refundData: {
  refundId: string;
  reason?: string;
  authorizedBy: string;
}): string {
  const template = `
    <div style="width: 58mm; font-family: monospace; font-size: 12px;">
      <h2 style="text-align: center; margin: 10px 0;">REFUND RECEIPT</h2>
      
      <hr style="border: 1px dashed #000;">
      
      <p style="margin: 5px 0;">Refund ID: ${refundData.refundId}</p>
      <p style="margin: 5px 0;">Order #${receipt.order_number}</p>
      <p style="margin: 5px 0;">Date: ${new Date().toLocaleString()}</p>
      
      <hr style="border: 1px dashed #000;">
      
      <div style="display: flex; justify-content: space-between; margin: 10px 0; font-weight: bold; font-size: 14px;">
        <span>Refund Amount:</span>
        <span>RM ${receipt.total.toFixed(2)}</span>
      </div>
      
      ${refundData.reason ? `<p style="margin: 10px 0;">Reason: ${refundData.reason}</p>` : ''}
      
      <p style="margin: 10px 0;">Authorized by: ${refundData.authorizedBy}</p>
      
      <hr style="border: 1px dashed #000;">
      
      <p style="text-align: center; margin: 10px 0; font-size: 10px;">
        Please keep this receipt for your records
      </p>
    </div>
  `;
  
  return template;
}
