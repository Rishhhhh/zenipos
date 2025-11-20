export interface Receipt {
  order_id: string;
  order_number: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method?: string;
  timestamp: Date;
}

export interface KitchenTicket extends Receipt {
  station: string;
  notes?: string;
}

export interface PrintProvider {
  name: string;
  print58mm(receipt: Receipt): Promise<void>;
  print80mm(ticket: KitchenTicket): Promise<void>;
  testConnection(): Promise<boolean>;
}

/**
 * CloudPRNT stub implementation
 * Phase 2: Integrate with Star CloudPRNT or Epson ePOS
 */
export class CloudPrintService implements PrintProvider {
  name = 'CloudPRNT';
  private endpoint: string;

  constructor(endpoint: string = 'https://cloudprnt.example.com') {
    this.endpoint = endpoint;
  }

  /**
   * Send raw ESC/POS data to a printer via IP address
   * For now, this is a stub - Phase 2 will implement actual network printing
   */
  async printRaw(ipAddress: string, escposData: string): Promise<void> {
    console.log(`🖨️  [Raw Print to ${ipAddress}]`);
    console.log(escposData);
    
    // Phase 2: Send raw data to network printer
    // Example: Use raw TCP socket or HTTP endpoint
    // await fetch(`http://${ipAddress}:9100/print`, {
    //   method: 'POST',
    //   body: escposData,
    //   headers: { 'Content-Type': 'application/octet-stream' }
    // });
    
    return Promise.resolve();
  }

  async print58mm(receipt: Receipt): Promise<void> {
    console.log('🧾 [58mm Receipt]', receipt);
    
    // Stub: Generate ESC/POS commands
    const escpos = this.generateReceiptESCPOS(receipt);
    console.log(escpos);
    
    // Phase 2: Send to CloudPRNT endpoint
    // await fetch(`${this.endpoint}/print`, {
    //   method: 'POST',
    //   body: JSON.stringify({ data: escpos, printer: '58mm' }),
    // });
    
    return Promise.resolve();
  }

  async print80mm(ticket: KitchenTicket): Promise<void> {
    console.log('🍳 [80mm Kitchen Ticket]', ticket);
    
    // Stub: Generate ESC/POS commands
    const escpos = this.generateTicketESCPOS(ticket);
    console.log(escpos);
    
    // Phase 2: Send to CloudPRNT endpoint
    
    return Promise.resolve();
  }

  async testConnection(): Promise<boolean> {
    console.log('🔌 Testing CloudPRNT connection...');
    // Phase 2: Ping endpoint
    return Promise.resolve(true);
  }

  private generateReceiptESCPOS(receipt: Receipt): string {
    // Simplified ESC/POS template
    return `
=== RECEIPT ===
Order #${receipt.order_number}
${new Date(receipt.timestamp).toLocaleString()}

${receipt.items.map(i => `${i.quantity}x ${i.name} - $${i.total.toFixed(2)}`).join('\n')}

Subtotal: $${receipt.subtotal.toFixed(2)}
Tax:      $${receipt.tax.toFixed(2)}
Total:    $${receipt.total.toFixed(2)}

Thank you!
    `;
  }

  private generateTicketESCPOS(ticket: KitchenTicket): string {
    return `
=== ${ticket.station.toUpperCase()} ===
Order #${ticket.order_number}
${new Date(ticket.timestamp).toLocaleString()}

${ticket.items.map(i => `${i.quantity}x ${i.name}`).join('\n')}

${ticket.notes ? `Notes: ${ticket.notes}` : ''}
    `;
  }
}

// Singleton instance
export const printService = new CloudPrintService();
