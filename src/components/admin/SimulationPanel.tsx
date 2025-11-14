import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useBranch } from '@/contexts/BranchContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Play, Pause, Square, Trash2, Sparkles } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { SimulationSpeed, ArrivalRate } from '@/lib/simulation/types';
import { RestaurantFlowVisualization } from './RestaurantFlowVisualization';
import { LiveSimulationStats } from './LiveSimulationStats';
import { clearSimulatedData } from '@/lib/simulation/cleanup';
import { useToast } from '@/hooks/use-toast';

export function SimulationPanel() {
  const [speed, setSpeed] = useState<SimulationSpeed>(1);
  const [arrivalRate, setArrivalRate] = useState<ArrivalRate>('medium');
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();
  const { currentBranch } = useBranch();

  const {
    isRunning,
    isPaused,
    activeOrders,
    stats,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
  } = useSimulation({
    speed,
    arrivalRate,
  }, currentBranch?.id || '');

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      const result = await clearSimulatedData();
      if (result.success) {
        toast({
          title: '✅ Simulated Data Cleared',
          description: `Removed ${result.ordersDeleted} simulated orders`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: '❌ Failed to clear data',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="p-6 border-primary/50 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Live Restaurant Simulation
                  {isRunning && !isPaused && (
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-600 rounded-full animate-pulse">
                      ● Live
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Watch the complete restaurant workflow in real-time with dynamic data generation
                </p>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="speed">Simulation Speed</Label>
                  <Select
                    value={speed.toString()}
                    onValueChange={(value) => setSpeed(Number(value) as SimulationSpeed)}
                    disabled={isRunning}
                  >
                    <SelectTrigger id="speed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1x (Real-time)</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                      <SelectItem value="5">5x</SelectItem>
                      <SelectItem value="10">10x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival-rate">Customer Arrival Rate</Label>
                  <Select
                    value={arrivalRate}
                    onValueChange={(value) => setArrivalRate(value as ArrivalRate)}
                    disabled={isRunning}
                  >
                    <SelectTrigger id="arrival-rate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (5/hour)</SelectItem>
                      <SelectItem value="medium">Medium (15/hour)</SelectItem>
                      <SelectItem value="high">High (30/hour)</SelectItem>
                      <SelectItem value="rush">Rush (50/hour)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 min-w-[180px]">
            {!isRunning ? (
              <Button onClick={startSimulation} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Simulation
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button onClick={resumeSimulation} variant="default" className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                ) : (
                  <Button onClick={pauseSimulation} variant="secondary" className="w-full">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button onClick={stopSimulation} variant="destructive" className="w-full">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isClearing || isRunning}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Simulated Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all simulated orders, payments, and related records.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearData}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Clear All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>

      {/* Live Stats */}
      {isRunning && <LiveSimulationStats stats={stats} />}

      {/* Flow Visualization */}
      {isRunning && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">🎬 Live Restaurant Flow</h4>
          <RestaurantFlowVisualization orders={activeOrders} />
        </Card>
      )}
    </div>
  );
}
