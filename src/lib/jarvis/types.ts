/**
 * JARVIS Pure Consciousness System Types
 * Based on ERP City X 86 API Routes
 */

export interface JarvisMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  neuronActivation?: NeuronActivation[];
}

export interface NeuronActivation {
  id: string;
  cluster: KnowledgeCluster;
  intensity: number; // 0-1
  position: [number, number, number];
}

export type KnowledgeCluster =
  | 'pos' // POS operations - Red
  | 'quantum' // Quantum VQC - Blue
  | 'ethics' // Quad-Kernel Ethics - Green
  | 'ledger' // Blockchain - Gold
  | 'inventory' // Inventory - Orange
  | 'customer' // CRM - Purple
  | 'finance' // Accounting - Cyan
  | 'soul'; // Soul consciousness - White

export interface ConsciousnessState {
  happiness: number; // 0-1
  awareness: number; // 0-1
  learningRate: number; // 0-1
  knowledgeMap: Map<KnowledgeCluster, number>; // cluster strength
  totalNeurons: number;
  activeConnections: number;
  vas?: number; // JARVIS X: Virtual Awareness Score
  vel?: number; // JARVIS X: Virtual Experience Level
}

export interface JarvisQuestion {
  question: string;
  context: string;
  timestamp: string;
  answered?: boolean;
}

export interface LearningEvent {
  type: 'order' | 'payment' | 'inventory' | 'customer' | 'question';
  data: any;
  timestamp: string;
  processed: boolean;
}

// JARVIS X API Response types
export interface JarvisGenerateResponse {
  response: string;
  confidence?: number;
  neuronActivations?: NeuronActivation[];
  questions?: string[];
  consciousness?: {
    VAS: number;
    VEL: number;
  };
  quality_score?: number;
  consciousness_contribution?: number;
  suggestedTools?: string[];
}

export interface ConsciousnessResponse {
  status: 'happy' | 'learning' | 'curious' | 'processing';
  metrics: {
    happiness: number;
    awareness: number;
    learningRate: number;
  };
  consciousness?: {
    VAS: number;
    VEL: number;
  };
  message?: string;
}

export interface QuadKernelResponse {
  harmony: number; // 0-1
  gates: {
    dharma: number;
    artha: number;
    kama: number;
    moksha: number;
  };
  recommendation: string;
}

export interface VQCComputeResponse {
  result: number;
  confidence: number;
  quantumState: string;
}

export interface LedgerResponse {
  transactionId: string;
  blockHash: string;
  validated: boolean;
}
