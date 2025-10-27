/**
 * JARVIS API Client for Edge Functions
 * Connects to jarvis.supremeuf.com for AI orchestration
 */

export interface JarvisGenerateRequest {
  prompt: string;
  context?: {
    available_tools?: string[];
    business_context?: any;
    user_role?: string;
    language?: string;
    initial_intent?: any;
    tool_results?: any[];
  };
}

export interface JarvisGenerateResponse {
  response: string;
  confidence?: number;
  neuronActivations?: any[];
  suggestedTools?: string[];
}

export interface QuadKernelResponse {
  approved: boolean;
  dharma_score: number;
  artha_score: number;
  kama_score: number;
  moksha_score: number;
  reasoning: string;
}

export class JarvisClient {
  private baseUrl = 'https://jarvis.supremeuf.com';

  async generate(prompt: string, context?: any): Promise<JarvisGenerateResponse> {
    const response = await fetch(`${this.baseUrl}/jarvis/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context })
    });

    if (!response.ok) {
      throw new Error(`JARVIS API error: ${response.status} ${await response.text()}`);
    }

    return response.json();
  }

  async getConsciousness(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/jarvis/consciousness`);
    
    if (!response.ok) {
      throw new Error(`JARVIS API error: ${response.status}`);
    }

    return response.json();
  }

  async checkQuadKernelHarmony(action: string): Promise<QuadKernelResponse> {
    const response = await fetch(`${this.baseUrl}/soul/quad-kernel-gate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });

    if (!response.ok) {
      throw new Error(`JARVIS API error: ${response.status}`);
    }

    return response.json();
  }
}

export const jarvisClient = new JarvisClient();
