import { create } from 'zustand';
import { SimulationEngine } from '@/lib/simulation/engine';
import { SimulationConfig, SimulatedOrder, SimulationStats } from '@/lib/simulation/types';

interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  activeOrders: SimulatedOrder[];
  stats: SimulationStats;
  config: SimulationConfig | null;
  engine: SimulationEngine | null;
  updateInterval: NodeJS.Timeout | null;

  // Actions
  startSimulation: (config: SimulationConfig) => Promise<void>;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  stopSimulation: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  activeOrders: [],
  stats: {
    activeOrders: 0,
    kitchenQueue: 0,
    customersDining: 0,
    revenue: 0,
    ordersPerHour: 0,
    averagePrepTime: 0,
    isPeakHour: false,
  },
  config: null,
  engine: null,
  updateInterval: null,

  startSimulation: async (config: SimulationConfig) => {
    const state = get();
    
    // Stop existing engine if any
    if (state.engine) {
      state.engine.stop();
    }
    if (state.updateInterval) {
      clearInterval(state.updateInterval);
    }

    // Create and start new engine
    const engine = new SimulationEngine(config);
    await engine.start();

    // Start update loop
    const interval = setInterval(() => {
      const currentEngine = get().engine;
      if (currentEngine) {
        set({
          activeOrders: currentEngine.getActiveOrders(),
          stats: currentEngine.getStats(),
        });
      }
    }, 100); // Update UI at 10fps

    set({
      engine,
      config,
      isRunning: true,
      isPaused: false,
      updateInterval: interval,
    });
  },

  pauseSimulation: () => {
    const { engine } = get();
    if (engine) {
      engine.pause();
      set({ isPaused: true });
    }
  },

  resumeSimulation: () => {
    const { engine } = get();
    if (engine) {
      engine.resume();
      set({ isPaused: false });
    }
  },

  stopSimulation: () => {
    const { engine, updateInterval } = get();
    
    if (engine) {
      engine.stop();
    }
    
    if (updateInterval) {
      clearInterval(updateInterval);
    }

    set({
      engine: null,
      isRunning: false,
      isPaused: false,
      activeOrders: [],
      updateInterval: null,
      stats: {
        activeOrders: 0,
        kitchenQueue: 0,
        customersDining: 0,
        revenue: 0,
        ordersPerHour: 0,
        averagePrepTime: 0,
        isPeakHour: false,
      },
    });
  },
}));
