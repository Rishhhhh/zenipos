import { 
  CardTerminal, 
  CardTerminalConfig, 
  ChargeOptions, 
  CardTransactionResult,
  PreAuthResult,
  TerminalStatus 
} from '../CardTerminal';

/**
 * Ingenico Terminal Stub
 * Placeholder for future hardware integration
 * Phase 3: Real Ingenico SDK integration
 */
export class IngenicoTerminal implements CardTerminal {
  name = 'Ingenico Terminal';
  type: CardTerminalConfig['type'] = 'ingenico';
  private connected = false;

  async connect(config: CardTerminalConfig): Promise<boolean> {
    console.log('[IngenicoTerminal] Connect stub called', config);
    // Phase 3: Integrate Ingenico SDK
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    console.log('[IngenicoTerminal] Disconnect stub');
    this.connected = false;
  }

  async charge(amount: number, options: ChargeOptions): Promise<CardTransactionResult> {
    console.log('[IngenicoTerminal] Charge stub', { amount, options });
    
    // Phase 3: Call Ingenico API
    return {
      success: false,
      transactionId: '',
      error: 'Ingenico terminal not yet implemented. Use simulator for testing.'
    };
  }

  async preAuthorize(amount: number, orderId: string): Promise<PreAuthResult> {
    console.log('[IngenicoTerminal] Pre-auth stub', { amount, orderId });
    
    return {
      success: false,
      preAuthRef: '',
      authorizedAmount: 0,
      error: 'Ingenico terminal not yet implemented'
    };
  }

  async capturePreAuth(preAuthRef: string, amount: number): Promise<CardTransactionResult> {
    return {
      success: false,
      transactionId: '',
      error: 'Not implemented'
    };
  }

  async releasePreAuth(preAuthRef: string): Promise<boolean> {
    return false;
  }

  async refund(transactionId: string, amount: number): Promise<boolean> {
    console.log('[IngenicoTerminal] Refund stub', { transactionId, amount });
    return false;
  }

  async getStatus(): Promise<TerminalStatus> {
    return {
      connected: this.connected,
      ready: false,
      lastHeartbeat: new Date()
    };
  }
}
