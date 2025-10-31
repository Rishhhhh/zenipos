import { PaymentProvider, PaymentRequest, PaymentResponse } from '../PaymentProvider';

/**
 * DuitNow QR Payment Provider (Malaysia)
 * Uses FPX API for QR code generation
 * 
 * Integration Steps:
 * 1. Sign up for FPX merchant account
 * 2. Get API credentials (merchant ID, API key)
 * 3. Configure webhook endpoint for payment notifications
 */
export class DuitNowProvider implements PaymentProvider {
  name = 'DuitNow QR';
  private merchantId: string;
  private apiKey: string;
  private apiEndpoint: string;

  constructor(merchantId: string = 'test_merchant', apiKey: string = 'test_key') {
    this.merchantId = merchantId;
    this.apiKey = apiKey;
    this.apiEndpoint = 'https://api.fpx.com.my/v1';
  }

  async generateQRPayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log('💳 [DuitNow] Generate QR payment', request);
    
    try {
      // Phase 3: Real FPX API integration
      // const response = await fetch(`${this.apiEndpoint}/qr/create`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     merchant_id: this.merchantId,
      //     amount: Math.round(request.amount * 100), // Convert to sen
      //     currency: 'MYR',
      //     reference: request.order_id,
      //     callback_url: `${window.location.origin}/api/payment-webhook`,
      //   }),
      // });
      // const data = await response.json();
      
      // Stub: Return fake DuitNow QR
      return {
        success: true,
        transaction_id: `duitnow_${Date.now()}`,
        qr_code_url: `https://duitnow.fpx.com.my/qr/${request.order_id}`,
      };
    } catch (error) {
      console.error('[DuitNow] Payment generation failed:', error);
      return {
        success: false,
        error: 'Failed to generate DuitNow QR code',
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    console.log('✅ [DuitNow] Verify payment', transactionId);
    
    // Phase 3: Query FPX API for payment status
    // const response = await fetch(`${this.apiEndpoint}/qr/status/${transactionId}`, {
    //   headers: { 'Authorization': `Bearer ${this.apiKey}` },
    // });
    // const data = await response.json();
    // return data.status === 'paid';
    
    // Stub: Always return true after 2 seconds (simulate processing)
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  }

  async refund(transactionId: string, amount: number): Promise<boolean> {
    console.log('💸 [DuitNow] Refund', transactionId, amount);
    
    // Phase 3: Call FPX refund API
    // const response = await fetch(`${this.apiEndpoint}/refund`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     transaction_id: transactionId,
    //     amount: Math.round(amount * 100),
    //   }),
    // });
    // return response.ok;
    
    // Stub: Always succeed
    return true;
  }

  async preAuthorize(request: { amount: number; orderId: string }): Promise<any> {
    console.log('🔒 [DuitNow] Pre-authorize', request);
    
    // Stub: Return fake pre-auth
    return {
      success: true,
      preAuthRef: `preauth_duitnow_${Date.now()}`,
      cardBrand: 'DuitNow',
      cardLast4: '****',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  async capturePreAuth(preAuthRef: string, finalAmount: number): Promise<boolean> {
    console.log('💰 [DuitNow] Capture pre-auth', preAuthRef, finalAmount);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  async releasePreAuth(preAuthRef: string): Promise<boolean> {
    console.log('🔓 [DuitNow] Release pre-auth', preAuthRef);
    return true;
  }
}
