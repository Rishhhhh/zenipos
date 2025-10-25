export interface PaymentRequest {
  amount: number;
  currency: string;
  order_id: string;
  customer_email?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transaction_id?: string;
  qr_code_url?: string;
  redirect_url?: string;
  error?: string;
}

export interface PaymentProvider {
  name: string;
  generateQRPayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyPayment(transactionId: string): Promise<boolean>;
  refund(transactionId: string, amount: number): Promise<boolean>;
}

/**
 * Stripe QR stub implementation
 * Phase 2: Integrate with live Stripe API
 */
export class StripeProvider implements PaymentProvider {
  name = 'Stripe';
  private apiKey: string;

  constructor(apiKey: string = 'test_key') {
    this.apiKey = apiKey;
  }

  async generateQRPayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log('💳 [Stripe] Generate QR payment', request);
    
    // Stub: Return fake QR code URL
    // Phase 2: Call Stripe Payment Intents API
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: request.amount * 100,
    //   currency: request.currency,
    //   metadata: request.metadata,
    // });
    
    return {
      success: true,
      transaction_id: `stripe_${Date.now()}`,
      qr_code_url: `https://qr.stripe.com/test/${request.order_id}`,
    };
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    console.log('✅ [Stripe] Verify payment', transactionId);
    
    // Stub: Always return true
    // Phase 2: Check payment status via API
    
    return Promise.resolve(true);
  }

  async refund(transactionId: string, amount: number): Promise<boolean> {
    console.log('💸 [Stripe] Refund', transactionId, amount);
    
    // Stub: Always return true
    
    return Promise.resolve(true);
  }
}

/**
 * BillPLZ provider stub (recommended for QR payments)
 */
export class BillPLZProvider implements PaymentProvider {
  name = 'BillPLZ';
  private apiKey: string;

  constructor(apiKey: string = 'test_key') {
    this.apiKey = apiKey;
  }

  async generateQRPayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log('💳 [BillPLZ] Generate QR payment', request);
    
    // Stub: Return fake DuitNow QR
    return {
      success: true,
      transaction_id: `billplz_${Date.now()}`,
      qr_code_url: `https://duitnow.billplz.com/qr/${request.order_id}`,
    };
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    console.log('✅ [BillPLZ] Verify payment', transactionId);
    return Promise.resolve(true);
  }

  async refund(transactionId: string, amount: number): Promise<boolean> {
    console.log('💸 [BillPLZ] Refund', transactionId, amount);
    return Promise.resolve(true);
  }
}

// Factory function
export function createPaymentProvider(
  provider: 'stripe' | 'billplz' = 'stripe',
  apiKey?: string
): PaymentProvider {
  switch (provider) {
    case 'stripe':
      return new StripeProvider(apiKey);
    case 'billplz':
      return new BillPLZProvider(apiKey);
    default:
      return new StripeProvider(apiKey);
  }
}

// Default instance
export const paymentProvider = createPaymentProvider('stripe');
