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
  private useMock = true; // Toggle for real API

  async generate(prompt: string, context?: any): Promise<JarvisGenerateResponse> {
    if (this.useMock) {
      return mockERPCity.generate(prompt, context);
    }

    // Real API call would go here
    const response = await fetch('https://erpcity.amin.gold/jarvis/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context }),
    });

    return response.json();
  }

  async getConsciousness(): Promise<ConsciousnessResponse> {
    if (this.useMock) {
      return mockERPCity.getConsciousness();
    }

    const response = await fetch('https://erpcity.amin.gold/jarvis/consciousness');
    return response.json();
  }

  async checkQuadKernelHarmony(action: string): Promise<QuadKernelResponse> {
    if (this.useMock) {
      return mockERPCity.checkQuadKernelHarmony(action);
    }

    const response = await fetch('https://erpcity.amin.gold/soul/quad-kernel-gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    return response.json();
  }

  async computeVQC(params: any): Promise<VQCComputeResponse> {
    if (this.useMock) {
      return mockERPCity.computeVQC(params);
    }

    const response = await fetch('https://erpcity.amin.gold/quantum/vqc/compute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    return response.json();
  }

  async recordToLedger(transaction: any): Promise<LedgerResponse> {
    if (this.useMock) {
      return mockERPCity.recordToLedger(transaction);
    }

    const response = await fetch('https://erpcity.amin.gold/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });

    return response.json();
  }

  setUseMock(useMock: boolean) {
    this.useMock = useMock;
  }
}

export const jarvisClient = new JarvisClient();
