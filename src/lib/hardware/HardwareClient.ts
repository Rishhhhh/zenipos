/**
 * Hardware Bridge Client
 * WebSocket connection to Node.js hardware service
 * Supports MDB v4.3 and ccTalk protocols
 */

export type HardwareEventType = 
  | 'connected'
  | 'disconnected'
  | 'credit'
  | 'hopper_level'
  | 'dispense_success'
  | 'dispense_error'
  | 'status'
  | 'jam'
  | 'error';

export interface HardwareEvent {
  type: HardwareEventType;
  deviceId: string;
  data: any;
  timestamp: number;
}

export interface CreditEvent {
  denomination: number;
  type: 'coin' | 'bill';
  deviceId: string;
}

export interface HopperLevel {
  hopperId: string;
  denomination: number;
  currentLevel: number;
  capacity: number;
  lowThreshold: number;
}

export interface DispenseRequest {
  plan: { denomination: number; quantity: number }[];
  totalAmount: number;
}

export class HardwareClient {
  private ws: WebSocket | null = null;
  private listeners: Map<HardwareEventType, Set<(event: HardwareEvent) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 2000;
  private url: string;

  constructor(url: string = 'ws://localhost:8765') {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('🔌 Hardware bridge connected');
          this.reconnectAttempts = 0;
          this.emit({ type: 'connected', deviceId: 'bridge', data: {}, timestamp: Date.now() });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: HardwareEvent = JSON.parse(event.data);
            this.emit(message);
          } catch (error) {
            console.error('Failed to parse hardware message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('Hardware bridge error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 Hardware bridge disconnected');
          this.emit({ type: 'disconnected', deviceId: 'bridge', data: {}, timestamp: Date.now() });
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnect failed:', error);
      });
    }, delay);
  }

  on(eventType: HardwareEventType, callback: (event: HardwareEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  off(eventType: HardwareEventType, callback: (event: HardwareEvent) => void) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: HardwareEvent) {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((callback) => callback(event));
    }
  }

  send(command: string, data: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ command, data }));
    } else {
      console.warn('Hardware bridge not connected');
    }
  }

  // Command methods
  startSession() {
    this.send('start_session');
  }

  endSession() {
    this.send('end_session');
  }

  dispenseChange(request: DispenseRequest): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.off('dispense_success', successHandler);
        this.off('dispense_error', errorHandler);
        reject(new Error('Dispense timeout'));
      }, 30000); // 30s timeout

      const successHandler = (event: HardwareEvent) => {
        clearTimeout(timeout);
        this.off('dispense_error', errorHandler);
        resolve(true);
      };

      const errorHandler = (event: HardwareEvent) => {
        clearTimeout(timeout);
        this.off('dispense_success', successHandler);
        reject(new Error(event.data.error || 'Dispense failed'));
      };

      this.on('dispense_success', successHandler);
      this.on('dispense_error', errorHandler);

      this.send('dispense_change', request);
    });
  }

  requestHopperLevels(): Promise<HopperLevel[]> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.off('hopper_level', handler);
        reject(new Error('Hopper level request timeout'));
      }, 5000);

      const handler = (event: HardwareEvent) => {
        clearTimeout(timeout);
        resolve(event.data.hoppers);
      };

      this.on('hopper_level', handler);
      this.send('get_hopper_levels');
    });
  }

  enableAcceptance() {
    this.send('enable_acceptance');
  }

  disableAcceptance() {
    this.send('disable_acceptance');
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const hardwareClient = new HardwareClient();
