import { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationEngine } from '@/lib/simulation/engine';
import { SimulationConfig, SimulatedOrder, SimulationStats } from '@/lib/simulation/types';
import { useToast } from '@/hooks/use-toast';

export function useSimulation(config: SimulationConfig) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeOrders, setActiveOrders] = useState<SimulatedOrder[]>([]);
  const [stats, setStats] = useState<SimulationStats>({
    activeOrders: 0,
    kitchenQueue: 0,
    customersDining: 0,
    revenue: 0,
    ordersPerHour: 0,
    averagePrepTime: 0,
    isPeakHour: false,
  });

  const engineRef = useRef<SimulationEngine | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startSimulation = useCallback(async () => {
    if (engineRef.current) {
      engineRef.current.stop();
    }

    engineRef.current = new SimulationEngine(config);
    await engineRef.current.start();
    setIsRunning(true);
    setIsPaused(false);

    toast({
      title: '🎬 Simulation Started',
      description: 'Live restaurant flow is now running',
    });

    // Start update loop
    updateIntervalRef.current = setInterval(() => {
      if (engineRef.current) {
        setActiveOrders(engineRef.current.getActiveOrders());
        setStats(engineRef.current.getStats());
      }
    }, 100); // Update UI at 10fps
  }, [config, toast]);

  const pauseSimulation = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pause();
      setIsPaused(true);

      toast({
        title: '⏸️ Simulation Paused',
        description: 'Simulation is paused',
      });
    }
  }, [toast]);

  const resumeSimulation = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resume();
      setIsPaused(false);

      toast({
        title: '▶️ Simulation Resumed',
        description: 'Simulation is now running',
      });
    }
  }, [toast]);

  const stopSimulation = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    setIsRunning(false);
    setIsPaused(false);
    setActiveOrders([]);
    setStats({
      activeOrders: 0,
      kitchenQueue: 0,
      customersDining: 0,
      revenue: 0,
      ordersPerHour: 0,
      averagePrepTime: 0,
      isPeakHour: false,
    });

    toast({
      title: '⏹️ Simulation Stopped',
      description: 'Simulation has been stopped',
    });
  }, [toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  return {
    isRunning,
    isPaused,
    activeOrders,
    stats,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
  };
}
