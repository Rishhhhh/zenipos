import { 
  CardTerminal, 
  CardTerminalConfig, 
  ChargeOptions, 
  CardTransactionResult,
  PreAuthResult,
  TerminalStatus 
} from '../CardTerminal';

/**
 * Simulator Terminal for testing without physical hardware
 * Simulates card swipe/tap with realistic delays and responses
 */
export class SimulatorTerminal implements CardTerminal {
  name = 'Simulator Terminal';
  type: CardTerminalConfig['type'] = 'simulator';
  private connected = false;
  private preAuths: Map<string, { amount: number, orderId: string }> = new Map();

  async connect(config: CardTerminalConfig): Promise<boolean> {
    console.log('[SimulatorTerminal] Connecting...', config);
    await this.delay(500);
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    console.log('[SimulatorTerminal] Disconnecting...');
    this.connected = false;
  }

  async charge(amount: number, options: ChargeOptions): Promise<CardTransactionResult> {
    if (!this.connected) {
      return {
        success: false,
        transactionId: '',
        error: 'Terminal not connected'
      };
    }

    console.log('[SimulatorTerminal] Processing charge...', { amount, options });
    
    // Simulate card reading delay
    await this.delay(2000);
    
    // Simulate tip prompt if enabled
    let tipAmount = 0;
    if (options.enableTip) {
      // Simulate customer selecting 15% tip
      tipAmount = Math.round(amount * 0.15 * 100) / 100;
      await this.delay(1500);
    }
    
    const totalAmount = amount + tipAmount;
    
    // Simulate signature if required
    let signature: string | undefined;
    if (options.requireSignature && totalAmount >= (options.signatureThreshold || 250)) {
      signature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      await this.delay(3000);
    }
    
    // Simulate successful transaction
    return {
      success: true,
      transactionId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cardBrand: this.randomCardBrand(),
      cardLast4: this.randomLast4(),
      approvalCode: `SIM${Math.floor(Math.random() * 1000000)}`,
      tipAmount,
      totalAmount,
      signature
    };
  }

  async preAuthorize(amount: number, orderId: string): Promise<PreAuthResult> {
    if (!this.connected) {
      return {
        success: false,
        preAuthRef: '',
        authorizedAmount: 0,
        error: 'Terminal not connected'
      };
    }

    console.log('[SimulatorTerminal] Pre-authorizing...', { amount, orderId });
    
    await this.delay(2000);
    
    const preAuthRef = `preauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store pre-auth for later capture
    this.preAuths.set(preAuthRef, { amount, orderId });
    
    return {
      success: true,
      preAuthRef,
      cardBrand: this.randomCardBrand(),
      cardLast4: this.randomLast4(),
      authorizedAmount: amount
    };
  }

  async capturePreAuth(preAuthRef: string, amount: number): Promise<CardTransactionResult> {
    const preAuth = this.preAuths.get(preAuthRef);
    
    if (!preAuth) {
      return {
        success: false,
        transactionId: '',
        error: 'Pre-authorization not found'
      };
    }

    if (amount > preAuth.amount) {
      return {
        success: false,
        transactionId: '',
        error: 'Capture amount exceeds pre-authorized amount'
      };
    }

    console.log('[SimulatorTerminal] Capturing pre-auth...', { preAuthRef, amount });
    
    await this.delay(1500);
    
    // Remove pre-auth after capture
    this.preAuths.delete(preAuthRef);
    
    return {
      success: true,
      transactionId: `sim_capture_${Date.now()}`,
      cardBrand: this.randomCardBrand(),
      cardLast4: this.randomLast4(),
      approvalCode: `CAP${Math.floor(Math.random() * 1000000)}`,
      totalAmount: amount
    };
  }

  async releasePreAuth(preAuthRef: string): Promise<boolean> {
    const preAuth = this.preAuths.get(preAuthRef);
    
    if (!preAuth) {
      return false;
    }

    console.log('[SimulatorTerminal] Releasing pre-auth...', preAuthRef);
    
    await this.delay(1000);
    
    this.preAuths.delete(preAuthRef);
    return true;
  }

  async refund(transactionId: string, amount: number): Promise<boolean> {
    console.log('[SimulatorTerminal] Processing refund...', { transactionId, amount });
    
    await this.delay(2000);
    
    // Simulate successful refund
    return true;
  }

  async getStatus(): Promise<TerminalStatus> {
    return {
      connected: this.connected,
      ready: this.connected,
      batteryLevel: 85,
      lastHeartbeat: new Date()
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private randomCardBrand(): string {
    const brands = ['Visa', 'Mastercard', 'Amex', 'Discover'];
    return brands[Math.floor(Math.random() * brands.length)];
  }

  private randomLast4(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}
