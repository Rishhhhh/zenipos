import { DuitNowProvider } from './providers/DuitNowProvider';
import { TouchNGoProvider } from './providers/TouchNGoProvider';

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

export interface PreAuthRequest {
  amount: number;
  orderId: string;
  cardToken?: string;
}

export interface PreAuthResponse {
  success: boolean;
  preAuthRef: string;
  cardBrand?: string;
  cardLast4?: string;
  expiresAt?: Date;
  error?: string;
}

export interface PaymentProvider {
  name: string;
  generateQRPayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyPayment(transactionId: string): Promise<boolean>;
  refund(transactionId: string, amount: number): Promise<boolean>;
  preAuthorize(request: PreAuthRequest): Promise<PreAuthResponse>;
  capturePreAuth(preAuthRef: string, finalAmount: number): Promise<boolean>;
  releasePreAuth(preAuthRef: string): Promise<boolean>;
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

  async preAuthorize(request: { amount: number; orderId: string }): Promise<any> {
    console.log('🔒 [Stripe] Pre-authorize', request);
    
    return {
      success: true,
      preAuthRef: `preauth_stripe_${Date.now()}`,
      cardBrand: 'Visa',
      cardLast4: '4242',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  async capturePreAuth(preAuthRef: string, finalAmount: number): Promise<boolean> {
    console.log('💰 [Stripe] Capture pre-auth', preAuthRef, finalAmount);
    return true;
  }

  async releasePreAuth(preAuthRef: string): Promise<boolean> {
    console.log('🔓 [Stripe] Release pre-auth', preAuthRef);
    return true;
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

  async preAuthorize(request: { amount: number; orderId: string }): Promise<any> {
    console.log('🔒 [BillPLZ] Pre-authorize', request);
    
    return {
      success: true,
      preAuthRef: `preauth_billplz_${Date.now()}`,
      cardBrand: 'BillPLZ',
      cardLast4: '****',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  async capturePreAuth(preAuthRef: string, finalAmount: number): Promise<boolean> {
    console.log('💰 [BillPLZ] Capture pre-auth', preAuthRef, finalAmount);
    return true;
  }

  async releasePreAuth(preAuthRef: string): Promise<boolean> {
    console.log('🔓 [BillPLZ] Release pre-auth', preAuthRef);
    return true;
  }
}

// Factory function
export function createPaymentProvider(
  provider: 'duitnow' | 'tng' | 'stripe' | 'billplz' = 'duitnow',
  config?: { merchantId?: string; apiKey?: string }
): PaymentProvider {
  switch (provider) {
    case 'duitnow':
      return new DuitNowProvider(config?.merchantId, config?.apiKey);
    case 'tng':
      return new TouchNGoProvider(config?.merchantId, config?.apiKey);
    case 'stripe':
      return new StripeProvider(config?.apiKey);
    case 'billplz':
      return new BillPLZProvider(config?.apiKey);
    default:
      return new DuitNowProvider();
  }
}

// Default instance
export const paymentProvider = createPaymentProvider('duitnow');
