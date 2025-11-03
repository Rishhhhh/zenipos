import { Receipt, KitchenTicket } from './PrintService';

/**
 * Generate 58mm customer receipt HTML
 */
export function generate58mmReceipt(receipt: Receipt, options?: {
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
      
      <hr style="border: 1px dashed #000;">
      
      <p style="text-align: center; margin: 10px 0;">Thank you!</p>
      <p style="text-align: center; font-size: 10px;">Powered by MyPOS</p>
    </div>
  `;
  
  return template;
}

/**
 * Generate 80mm kitchen ticket HTML
 */
export function generate80mmKitchenTicket(ticket: KitchenTicket): string {
  const template = `
    <div style="width: 80mm; font-family: monospace; font-size: 16px;">
      <h1 style="text-align: center; margin: 15px 0; font-size: 24px;">${ticket.station.toUpperCase()}</h1>
      <h2 style="text-align: center; margin: 10px 0; font-size: 20px;">Order #${ticket.order_number}</h2>
      
      <p style="margin: 10px 0;">Time: ${new Date(ticket.timestamp).toLocaleTimeString()}</p>
      
      <hr style="border: 2px solid #000;">
      
      ${ticket.items.map(item => `
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
        Total Items: ${ticket.items.reduce((sum, item) => sum + item.quantity, 0)}
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
