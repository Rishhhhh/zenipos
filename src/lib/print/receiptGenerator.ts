import { Receipt, KitchenTicket } from './PrintService';

/**
 * Generate 58mm customer receipt HTML - Clean, dynamic template
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
  const paymentMethod = (receipt.payment_method || 'CASH').toUpperCase();
  const cashReceived = receipt.cash_received ?? receipt.total;
  const changeGiven = receipt.change_given ?? 0;
  const orderDate = new Date(receipt.timestamp);
  const dateStr = orderDate.toLocaleDateString('en-MY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = orderDate.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  const template = `
    <div style="width: 58mm; font-family: 'Courier New', Consolas, monospace; font-size: 11px; line-height: 1.4; padding: 4px;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 8px;">
        <p style="font-size: 16px; font-weight: 900; margin: 0; letter-spacing: 1px;">${(options?.restaurantName || 'RESTAURANT').toUpperCase()}</p>
        ${options?.address ? `<p style="font-size: 9px; margin: 4px 0 0 0; color: #333;">${options.address}</p>` : ''}
      </div>
      
      <!-- Dashed separator -->
      <p style="margin: 0; text-align: center; letter-spacing: 2px;">- - - - - - - - - - - - - - -</p>
      
      <!-- Order Info -->
      <div style="margin: 8px 0;">
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>REG</span>
          <span>${dateStr} ${timeStr}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>C01</span>
          <span style="font-weight: bold;">${receipt.order_number?.slice(-6) || '000000'}</span>
        </div>
      </div>
      
      <!-- Items section -->
      <p style="margin: 0; text-align: center; letter-spacing: 2px;">- - - - - - - - - - - - - - -</p>
      
      <div style="margin: 8px 0;">
        ${receipt.items.map(item => `
          <div style="margin: 6px 0;">
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="font-weight: 600; text-transform: uppercase;">${item.name}</span>
              <span style="font-weight: 700;">RM${item.total.toFixed(2)}</span>
            </div>
            <div style="font-size: 10px; color: #555; margin-left: 8px;">${item.quantity} No</div>
          </div>
        `).join('')}
      </div>
      
      <!-- Totals section -->
      <p style="margin: 0; text-align: center; letter-spacing: 2px;">- - - - - - - - - - - - - - -</p>
      
      <div style="margin: 8px 0;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin: 4px 0;">
          <span>SUBTOTAL</span>
          <span style="font-weight: 700;">RM${receipt.subtotal.toFixed(2)}</span>
        </div>
        ${receipt.tax > 0 ? `
        <div style="display: flex; justify-content: space-between; font-size: 10px; margin: 2px 0; color: #555;">
          <span>TAX</span>
          <span>RM${receipt.tax.toFixed(2)}</span>
        </div>
        ` : ''}
      </div>
      
      <!-- Payment section - Prominent -->
      <p style="margin: 0; text-align: center; letter-spacing: 2px;">= = = = = = = = = = = = = = =</p>
      
      <div style="margin: 10px 0; background: #f8f8f8; padding: 8px; border-radius: 2px;">
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; margin: 4px 0;">
          <span>TOTAL</span>
          <span>RM${receipt.total.toFixed(2)}</span>
        </div>
        
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin: 3px 0;">
            <span>${paymentMethod}</span>
            <span>RM${cashReceived.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin: 3px 0;">
            <span>CHANGE</span>
            <span>RM${changeGiven.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      ${receipt.einvoice_enabled ? `
        <p style="margin: 0; text-align: center; letter-spacing: 2px;">- - - - - - - - - - - - - - -</p>
        <div style="background: #f0f0f0; padding: 6px; margin: 6px 0; text-align: center;">
          <p style="margin: 0; font-weight: bold; font-size: 10px;">📄 e-Invoice: Pending</p>
          <p style="margin: 2px 0 0 0; font-size: 9px;">MyInvois submission in progress</p>
        </div>
      ` : ''}
      
      <!-- Footer -->
      <p style="margin: 8px 0 0 0; text-align: center; letter-spacing: 2px;">- - - - - - - - - - - - - - -</p>
      
      <div style="text-align: center; margin-top: 10px;">
        <p style="font-size: 13px; font-weight: 800; margin: 0;">THANK YOU!</p>
        <p style="font-size: 8px; color: #888; margin: 4px 0 0 0;">Powered by ZeniPOS</p>
      </div>
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
