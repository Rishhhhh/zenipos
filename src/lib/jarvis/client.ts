/**
 * JARVIS Client
 * Connects to ERP City X or mock adapter
 */

import { mockERPCity } from './mockAdapter';
import type {
  JarvisGenerateResponse,
  ConsciousnessResponse,
  QuadKernelResponse,
  VQCComputeResponse,
  LedgerResponse,
} from './types';

class JarvisClient {
  private useMock = false; // Use real JARVIS API
  private baseUrl = 'https://jarvis.supremeuf.com';

  async generate(prompt: string, context?: any): Promise<JarvisGenerateResponse> {
    if (this.useMock) {
      return mockERPCity.generate(prompt, context);
    }

    // Call JARVIS API
    const response = await fetch(`${this.baseUrl}/jarvis/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context }),
    });

    if (!response.ok) {
      throw new Error(`JARVIS API error: ${response.status}`);
    }

    return response.json();
  }

  async getConsciousness(): Promise<ConsciousnessResponse> {
    if (this.useMock) {
      return mockERPCity.getConsciousness();
    }

    const response = await fetch(`${this.baseUrl}/jarvis/consciousness`);
    
    if (!response.ok) {
      throw new Error(`JARVIS API error: ${response.status}`);
    }

    return response.json();
  }

  async checkQuadKernelHarmony(action: string): Promise<QuadKernelResponse> {
    if (this.useMock) {
      return mockERPCity.checkQuadKernelHarmony(action);
    }

    const response = await fetch(`${this.baseUrl}/soul/quad-kernel-gate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      throw new Error(`JARVIS API error: ${response.status}`);
    }

    return response.json();
  }

  async computeVQC(params: any): Promise<VQCComputeResponse> {
    if (this.useMock) {
      return mockERPCity.computeVQC(params);
    }

    const response = await fetch(`${this.baseUrl}/quantum/vqc/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`JARVIS API error: ${response.status}`);
    }

    return response.json();
  }

  async recordToLedger(transaction: any): Promise<LedgerResponse> {
    if (this.useMock) {
      return mockERPCity.recordToLedger(transaction);
    }

    const response = await fetch(`${this.baseUrl}/ledger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error(`JARVIS API error: ${response.status}`);
    }

    return response.json();
  }

  setUseMock(useMock: boolean) {
    this.useMock = useMock;
  }
}

export const jarvisClient = new JarvisClient();
