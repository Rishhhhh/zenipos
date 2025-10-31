/**
 * Card Terminal Abstraction Layer
 * Provides unified interface for physical card readers (Ingenico, Verifone, PAX, etc.)
 */

export interface CardTerminalConfig {
  type: 'ingenico' | 'verifone' | 'pax' | 'simulator';
  connection: 'usb' | 'bluetooth' | 'tcp' | 'cloud';
  deviceId?: string;
  ipAddress?: string;
  port?: number;
}

export interface ChargeOptions {
  orderId: string;
  customerName?: string;
  enableTip?: boolean;
  suggestedTipPercentages?: number[];
  requireSignature?: boolean;
  signatureThreshold?: number;
}

export interface CardTransactionResult {
  success: boolean;
  transactionId: string;
  cardBrand?: string;
  cardLast4?: string;
  approvalCode?: string;
  tipAmount?: number;
  totalAmount?: number;
  signature?: string;
  error?: string;
}

export interface PreAuthResult {
  success: boolean;
  preAuthRef: string;
  cardBrand?: string;
  cardLast4?: string;
  authorizedAmount: number;
  error?: string;
}

export interface TerminalStatus {
  connected: boolean;
  ready: boolean;
  batteryLevel?: number;
  lastHeartbeat?: Date;
}

export interface CardTerminal {
  name: string;
  type: CardTerminalConfig['type'];
  
  /**
   * Connect to the card terminal
   */
  connect(config: CardTerminalConfig): Promise<boolean>;
  
  /**
   * Disconnect from the card terminal
   */
  disconnect(): Promise<void>;
  
  /**
   * Charge a card for a specific amount
   */
  charge(amount: number, options: ChargeOptions): Promise<CardTransactionResult>;
  
  /**
   * Pre-authorize an amount (for tabs)
   */
  preAuthorize(amount: number, orderId: string): Promise<PreAuthResult>;
  
  /**
   * Capture a pre-authorized transaction
   */
  capturePreAuth(preAuthRef: string, amount: number): Promise<CardTransactionResult>;
  
  /**
   * Release/void a pre-authorization
   */
  releasePreAuth(preAuthRef: string): Promise<boolean>;
  
  /**
   * Refund a completed transaction
   */
  refund(transactionId: string, amount: number): Promise<boolean>;
  
  /**
   * Get current terminal status
   */
  getStatus(): Promise<TerminalStatus>;
  
  /**
   * Event handlers for card events
   */
  onCardInserted?: (callback: () => void) => void;
  onCardTapped?: (callback: () => void) => void;
  onTransactionProgress?: (callback: (progress: string) => void) => void;
}

/**
 * Terminal Manager - Manages multiple terminals
 */
export class TerminalManager {
  private terminals: Map<string, CardTerminal> = new Map();
  private activeTerminal: CardTerminal | null = null;

  registerTerminal(id: string, terminal: CardTerminal) {
    this.terminals.set(id, terminal);
    
    // Set as active if first terminal
    if (!this.activeTerminal) {
      this.activeTerminal = terminal;
    }
  }

  getTerminal(id: string): CardTerminal | undefined {
    return this.terminals.get(id);
  }

  getActiveTerminal(): CardTerminal | null {
    return this.activeTerminal;
  }

  setActiveTerminal(id: string): boolean {
    const terminal = this.terminals.get(id);
    if (terminal) {
      this.activeTerminal = terminal;
      return true;
    }
    return false;
  }

  async disconnectAll() {
    for (const terminal of this.terminals.values()) {
      await terminal.disconnect();
    }
  }
}

export const terminalManager = new TerminalManager();
