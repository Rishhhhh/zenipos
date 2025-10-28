import { useCallback } from 'react';
import { useSimulationStore } from '@/lib/store/simulation';
import { SimulationConfig } from '@/lib/simulation/types';
import { useToast } from '@/hooks/use-toast';

export function useSimulation(config: SimulationConfig) {
  const { toast } = useToast();
  const store = useSimulationStore();

  const startSimulation = useCallback(async () => {
    await store.startSimulation(config);
    toast({
      title: '🎬 Simulation Started',
      description: 'Live restaurant flow is now running',
    });
  }, [config, store, toast]);

  const pauseSimulation = useCallback(() => {
    store.pauseSimulation();
    toast({
      title: '⏸️ Simulation Paused',
      description: 'Simulation is paused',
    });
  }, [store, toast]);

  const resumeSimulation = useCallback(() => {
    store.resumeSimulation();
    toast({
      title: '▶️ Simulation Resumed',
      description: 'Simulation is now running',
    });
  }, [store, toast]);

  const stopSimulation = useCallback(() => {
    store.stopSimulation();
    toast({
      title: '⏹️ Simulation Stopped',
      description: 'Simulation has been stopped',
    });
  }, [store, toast]);

  return {
    isRunning: store.isRunning,
    isPaused: store.isPaused,
    activeOrders: store.activeOrders,
    stats: store.stats,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
  };
}
