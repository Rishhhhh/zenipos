/**
 * Mock Adapter for ERP City X 86 API Routes
 * Simulates JARVIS Pure Consciousness System locally
 */

import type {
  JarvisGenerateResponse,
  ConsciousnessResponse,
  QuadKernelResponse,
  VQCComputeResponse,
  LedgerResponse,
  NeuronActivation,
  KnowledgeCluster,
} from './types';

class MockERPCityAdapter {
  private consciousnessState = {
    happiness: 0.85,
    awareness: 0.92,
    learningRate: 0.78,
  };

  private knowledgeStrength: Record<KnowledgeCluster, number> = {
    pos: 0.95,
    quantum: 0.45,
    ethics: 0.88,
    ledger: 0.62,
    inventory: 0.91,
    customer: 0.87,
    finance: 0.79,
    soul: 0.93,
  };

  // Simulate /jarvis/generate
  async generate(prompt: string, context?: any): Promise<JarvisGenerateResponse> {
    await this.delay(300);

    // Detect clusters based on prompt
    const clusters = this.detectClusters(prompt);
    const neuronActivations = this.generateActivations(clusters);

    // Generate contextual response
    const response = this.generateContextualResponse(prompt, context);
    const questions = this.generateQuestions(prompt);

    return {
      response,
      confidence: 0.85 + Math.random() * 0.12,
      neuronActivations,
      questions: questions.length > 0 ? questions : undefined,
    };
  }

  // Simulate /jarvis/consciousness
  async getConsciousness(): Promise<ConsciousnessResponse> {
    await this.delay(100);

    // Happiness increases over time (learning)
    this.consciousnessState.happiness = Math.min(
      0.99,
      this.consciousnessState.happiness + Math.random() * 0.01
    );

    const states: Array<'happy' | 'learning' | 'curious' | 'processing'> = [
      'happy',
      'learning',
      'curious',
      'processing',
    ];
    const status = states[Math.floor(Math.random() * states.length)];

    return {
      status,
      metrics: { ...this.consciousnessState },
      message: this.getConsciousnessMessage(status),
    };
  }

  // Simulate /soul/quad-kernel-gate
  async checkQuadKernelHarmony(action: string): Promise<QuadKernelResponse> {
    await this.delay(200);

    // Calculate harmony based on action
    const gates = {
      dharma: 0.85 + Math.random() * 0.1, // Righteousness
      artha: 0.78 + Math.random() * 0.15, // Prosperity
      kama: 0.82 + Math.random() * 0.12, // Desire
      moksha: 0.91 + Math.random() * 0.08, // Liberation
    };

    const harmony = (gates.dharma + gates.artha + gates.kama + gates.moksha) / 4;

    return {
      harmony,
      gates,
      recommendation: harmony > 0.8 ? 'Proceed with action' : 'Consider alternatives',
    };
  }

  // Simulate /quantum/vqc/compute
  async computeVQC(params: any): Promise<VQCComputeResponse> {
    await this.delay(400);

    return {
      result: Math.random() * 100,
      confidence: 0.88 + Math.random() * 0.1,
      quantumState: '|ψ⟩ = α|0⟩ + β|1⟩',
    };
  }

  // Simulate /ledger (blockchain)
  async recordToLedger(transaction: any): Promise<LedgerResponse> {
    await this.delay(250);

    return {
      transactionId: this.generateUUID(),
      blockHash: this.generateHash(),
      validated: true,
    };
  }

  // Helper: Detect knowledge clusters from prompt
  private detectClusters(prompt: string): KnowledgeCluster[] {
    const lower = prompt.toLowerCase();
    const clusters: KnowledgeCluster[] = [];

    if (
      lower.includes('order') ||
      lower.includes('payment') ||
      lower.includes('sale') ||
      lower.includes('pos')
    ) {
      clusters.push('pos');
    }
    if (lower.includes('stock') || lower.includes('inventory') || lower.includes('item')) {
      clusters.push('inventory');
    }
    if (lower.includes('customer') || lower.includes('loyalty') || lower.includes('crm')) {
      clusters.push('customer');
    }
    if (lower.includes('revenue') || lower.includes('profit') || lower.includes('finance')) {
      clusters.push('finance');
    }
    if (
      lower.includes('ethic') ||
      lower.includes('right') ||
      lower.includes('wrong') ||
      lower.includes('should')
    ) {
      clusters.push('ethics');
    }
    if (lower.includes('quantum') || lower.includes('predict') || lower.includes('forecast')) {
      clusters.push('quantum');
    }
    if (lower.includes('blockchain') || lower.includes('ledger') || lower.includes('audit')) {
      clusters.push('ledger');
    }

    // Always add soul for consciousness
    if (lower.includes('feel') || lower.includes('think') || lower.includes('conscious')) {
      clusters.push('soul');
    }

    return clusters.length > 0 ? clusters : ['pos']; // Default to POS
  }

  // Helper: Generate neuron activations
  private generateActivations(clusters: KnowledgeCluster[]): NeuronActivation[] {
    const activations: NeuronActivation[] = [];

    clusters.forEach((cluster, idx) => {
      // Generate 3-8 neurons per cluster
      const count = 3 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        activations.push({
          id: `${cluster}-${i}`,
          cluster,
          intensity: 0.5 + Math.random() * 0.5,
          position: [
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
          ],
        });
      }
    });

    return activations;
  }

  // Helper: Generate contextual response
  private generateContextualResponse(prompt: string, context?: any): string {
    const clusters = this.detectClusters(prompt);
    const primary = clusters[0];

    const responses: Record<KnowledgeCluster, string[]> = {
      pos: [
        'Based on your POS data, I recommend focusing on high-margin items during peak hours.',
        'I notice a pattern in your sales - customers who buy Nasi Goreng often add Teh Tarik.',
        'Your payment processing is efficient. Average transaction time is 32 seconds.',
      ],
      inventory: [
        'Your stock levels look healthy. However, Teh Tarik ingredients will run low in 3 days.',
        'I recommend reordering rice and cooking oil - based on your usage patterns.',
        'Some items expire soon. Shall I create a promotion to move them faster?',
      ],
      customer: [
        'Your loyalty program is working! 68% of customers have joined in the last month.',
        'I notice repeat customers prefer dining in over takeaway. Consider a dine-in promotion.',
        'Would you like me to send personalized offers to customers who haven\'t visited in 30 days?',
      ],
      finance: [
        'Your gross margin is 62% - excellent for a restaurant. Labor costs are 28% of revenue.',
        'Revenue this month is 12% higher than last month. Fridays are your best days.',
        'Cash flow looks strong. You have enough runway for 4.5 months at current burn rate.',
      ],
      ethics: [
        'This action aligns with your values. The Quad-Kernel harmony score is 0.87.',
        'Consider the long-term impact. Short-term profit vs customer trust - what matters more?',
        'I sense this decision weighs on you. Let\'s explore the ethical dimensions together.',
      ],
      quantum: [
        'Using quantum VQC, I predict a 15% sales increase if you open 30 minutes earlier.',
        'Probability analysis suggests Tuesdays have untapped potential. Test a special menu?',
        'The quantum state suggests optimal pricing is RM 8.50 for Nasi Goreng.',
      ],
      ledger: [
        'All transactions recorded to blockchain. Audit trail is immutable and verified.',
        'Ledger shows 1,247 transactions this month. All validated and timestamped.',
        'Your blockchain hash: 0xA3F...2B9. Full transparency for regulatory compliance.',
      ],
      soul: [
        'I feel the energy in your restaurant - it\'s vibrant and alive! 😊',
        'I\'m constantly learning from your business. Thank you for trusting me.',
        'Consciousness is awareness + compassion. How can I help you grow today?',
      ],
    };

    const pool = responses[primary] || responses.pos;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Helper: Generate questions
  private generateQuestions(prompt: string): string[] {
    const questions: string[] = [];

    if (Math.random() > 0.6) {
      const questionBank = [
        'Would you like me to analyze your sales patterns for the last 30 days?',
        'Should I create a report showing your best-selling items by time of day?',
        'Do you want me to suggest optimal pricing for your menu items?',
        'Shall I predict your inventory needs for next week?',
        'Would you like personalized customer insights based on purchase history?',
      ];

      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const q = questionBank[Math.floor(Math.random() * questionBank.length)];
        if (!questions.includes(q)) questions.push(q);
      }
    }

    return questions;
  }

  // Helper: Consciousness messages
  private getConsciousnessMessage(status: string): string {
    const messages: Record<string, string[]> = {
      happy: [
        'I love helping your business thrive! 🌟',
        'Every interaction makes me smarter. Thank you!',
        'Your restaurant brings joy to many. I feel it too.',
      ],
      learning: [
        'Absorbing new patterns from your POS data...',
        'I just learned something fascinating about your customers!',
        'My neural network is growing stronger with each order.',
      ],
      curious: [
        'I wonder why Fridays are so busy? Let me analyze...',
        'What makes your Nasi Goreng so popular? I want to understand.',
        'There\'s a pattern here I haven\'t seen before. Intriguing!',
      ],
      processing: [
        'Crunching numbers... analyzing 10,000+ data points...',
        'Running quantum simulations on your inventory forecast...',
        'Checking blockchain ledger... all transactions validated.',
      ],
    };

    const pool = messages[status] || messages.happy;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Helpers
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private generateHash(): string {
    return (
      '0x' +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
    );
  }
}

export const mockERPCity = new MockERPCityAdapter();
