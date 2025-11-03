import { PaymentProvider, PaymentRequest, PaymentResponse } from '../PaymentProvider';

/**
 * Touch 'n Go eWallet Payment Provider (Malaysia)
 * 
 * Integration Steps:
 * 1. Sign up for TNG merchant account
 * 2. Get API credentials
 * 3. Configure webhook for payment notifications
 */
export class TouchNGoProvider implements PaymentProvider {
  name = "Touch 'n Go eWallet";
  private merchantId: string;
  private apiKey: string;
  private apiEndpoint: string;

  constructor(merchantId: string = 'test_merchant', apiKey: string = 'test_key') {
    this.merchantId = merchantId;
    this.apiKey = apiKey;
    this.apiEndpoint = 'https://api.tngdigital.com.my/v1';
  }

  async generateQRPayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log('💳 [TNG] Generate QR payment', request);
    
    try {
      // Phase 3: Real TNG API integration
      // Similar to DuitNow implementation
      
      // Stub: Return fake TNG QR
      return {
        success: true,
        transaction_id: `tng_${Date.now()}`,
        qr_code_url: `https://tng.com.my/qr/${request.order_id}`,
      };
    } catch (error) {
      console.error('[TNG] Payment generation failed:', error);
      return {
        success: false,
        error: 'Failed to generate TNG QR code',
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    console.log('✅ [TNG] Verify payment', transactionId);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  }

  async refund(transactionId: string, amount: number): Promise<boolean> {
    console.log('💸 [TNG] Refund', transactionId, amount);
    return true;
  }
}
