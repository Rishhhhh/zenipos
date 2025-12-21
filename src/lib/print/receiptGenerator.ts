import { Receipt, KitchenTicket } from './PrintService';

/**
 * Generate 58mm customer receipt HTML
 */
export function generate58mmReceipt(receipt: Receipt & { 
  einvoice_enabled?: boolean;
  cash_received?: number;
  change_given?: number;
}, options?: {
  restaurantName?: string;
  address?: string;
  cashier?: string;
}): string {
  const paymentMethod = (receipt.payment_method || 'Cash').toUpperCase();
  const cashReceived = receipt.cash_received ?? receipt.total;
  const changeGiven = receipt.change_given ?? 0;
  
  const template = `
    <div style="width: 58mm; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.3;">
      <h2 style="text-align: center; margin: 8px 0; font-size: 14px; font-weight: bold; letter-spacing: 1px;">${options?.restaurantName || 'Restaurant'}</h2>
      ${options?.address ? `<p style="text-align: center; font-size: 9px; margin: 0 0 5px 0;">${options.address}</p>` : ''}
      <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;">
      
      <p style="margin: 3px 0; font-size: 10px;">Order #${receipt.order_number}</p>
      <p style="margin: 3px 0; font-size: 10px;">Date: ${new Date(receipt.timestamp).toLocaleString('en-MY')}</p>
      ${options?.cashier ? `<p style="margin: 3px 0; font-size: 10px;">Cashier: ${options.cashier}</p>` : ''}
      
      <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;">
      
      ${receipt.items.map(item => `
        <div style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 11px;">
          <span style="flex: 1;">${item.quantity}x ${item.name.toUpperCase()}</span>
          <span style="font-weight: bold; min-width: 55px; text-align: right;">RM${item.total.toFixed(2)}</span>
        </div>
      `).join('')}
      
      <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;">
      
      <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 10px;">
        <span>SUBTOTAL</span>
        <span style="font-weight: bold;">RM${receipt.subtotal.toFixed(2)}</span>
      </div>
      ${receipt.tax > 0 ? `
      <div style="display: flex; justify-content: space-between; margin: 3px 0; font-size: 10px;">
        <span>TAX</span>
        <span style="font-weight: bold;">RM${receipt.tax.toFixed(2)}</span>
      </div>
      ` : ''}
      
      <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;">
      
      <div style="display: flex; justify-content: space-between; margin: 6px 0; font-weight: bold; font-size: 14px;">
        <span>TOTAL</span>
        <span>RM${receipt.total.toFixed(2)}</span>
      </div>
      
      <hr style="border: none; border-top: 2px solid #000; margin: 8px 0;">
      
      <div style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 12px;">
        <span style="font-weight: bold;">${paymentMethod}</span>
        <span style="font-weight: bold;">RM${cashReceived.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 12px;">
        <span style="font-weight: bold;">CHANGE</span>
        <span style="font-weight: bold;">RM${changeGiven.toFixed(2)}</span>
      </div>
      
      ${receipt.einvoice_enabled ? `
        <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;">
        <div style="background: #f5f5f5; padding: 6px; margin: 5px 0;">
          <p style="margin: 2px 0; font-weight: bold; font-size: 10px;">📄 e-Invoice: Pending</p>
          <p style="margin: 2px 0; font-size: 9px;">MyInvois submission in progress</p>
        </div>
      ` : ''}
      
      <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;">
      
      <p style="text-align: center; margin: 8px 0; font-weight: bold; font-size: 12px;">THANK YOU!</p>
      <p style="text-align: center; font-size: 8px; color: #666;">Powered by ZeniPOS</p>
    </div>
  `;
  
  return template;
}

/**
 * Generate 80mm kitchen ticket HTML - ENHANCED FOR READABILITY
 */
export function generate80mmKitchenTicket(ticket: KitchenTicket): string {
  const totalItems = ticket.items.reduce((sum, item) => sum + item.quantity, 0);
  const timestamp = new Date(ticket.timestamp);
  const time = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = timestamp.toLocaleDateString('en-GB');
  
  const lines: string[] = [];

  // Station header - BOLD and prominent
  lines.push('================================');
  lines.push(`     ${ticket.station.toUpperCase()}`);
  lines.push('================================');
  lines.push('');
  
  // Order number - LARGE and BOLD
  lines.push(`#${ticket.order_number}`);
  lines.push('');

  // Table info - BOLD (if available from context)
  lines.push(`TABLE: (from order)`);
  lines.push('');

  // DateTime and order type
  lines.push(`${date} ${time}`);
  lines.push(`Order Type: DINE IN`);
  lines.push('................................');
  lines.push('');

  // Items - BOLD quantities and item names
  for (const item of ticket.items) {
    lines.push(`${item.quantity} x ${item.name.toUpperCase()}`);
    lines.push(''); // spacing between items
  }

  // Order notes if any
  if (ticket.notes) {
    lines.push('................................');
    lines.push('SPECIAL INSTRUCTIONS:');
    lines.push(`>>> ${ticket.notes.toUpperCase()} <<<`);
    lines.push('................................');
    lines.push('');
  }

  lines.push('================================');
  lines.push(`TOTAL ITEMS: ${totalItems}`);
  lines.push(`Printed: ${timestamp.toLocaleTimeString()}`);
  lines.push('================================');

  const content = lines.join('\n');

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
          line-height: 1.4;
          max-width: 80mm;
          margin: 0 auto;
          padding: 5mm;
          white-space: pre-wrap;
        }
      </style>
    </head>
    <body><strong>${content.replace(/\n(={32}.*?={32})\n/g, '\n</strong>$1<strong>\n')
                          .replace(/\n(#[A-Z0-9-]+)\n/g, '\n<span style="font-size: 20px; font-weight: bold;">$1</span>\n')
                          .replace(/\n(TABLE: .*?)\n/g, '\n<strong style="font-size: 14px;">$1</strong>\n')
                          .replace(/\n(\d+ x .*?)\n/g, '\n<strong style="font-size: 13px;">$1</strong>\n')
                          .replace(/\n(SPECIAL INSTRUCTIONS:)\n/g, '\n<strong>$1</strong>\n')
                          .replace(/\n(TOTAL ITEMS: .*?)\n/g, '\n<strong style="font-size: 13px;">$1</strong>\n')}</strong></body>
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
