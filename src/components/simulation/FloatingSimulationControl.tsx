import { useState } from 'react';
import { useSimulationStore } from '@/lib/store/simulation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, Square, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FloatingSimulationControl() {
  const { isRunning, isPaused, stats, pauseSimulation, resumeSimulation, stopSimulation } = useSimulationStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isRunning) return null;

  const formatCurrency = (amount: number) => `RM${amount.toFixed(2)}`;

  return (
    <div className="fixed bottom-20 right-4 z-50 transition-all duration-300">
      {isExpanded ? (
        // Expanded Control Panel
        <Card className="w-72 bg-background/95 backdrop-blur-lg border-primary/20 shadow-2xl">
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎬</span>
                <span className="font-semibold text-sm">Live Simulation</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-muted-foreground">Active Orders</div>
                <div className="text-lg font-bold">{stats.activeOrders}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-muted-foreground">Kitchen Queue</div>
                <div className="text-lg font-bold">{stats.kitchenQueue}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-muted-foreground">Revenue</div>
                <div className="text-lg font-bold">{formatCurrency(stats.revenue)}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-muted-foreground">Orders/Hour</div>
                <div className="text-lg font-bold">{stats.ordersPerHour}</div>
              </div>
            </div>

            {/* Status Badge */}
            {stats.isPeakHour && (
              <div className="flex items-center justify-center gap-2 py-1 px-3 bg-warning/20 text-warning rounded-full text-xs font-medium">
                <span>🔥</span>
                <span>Peak Hour</span>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2">
              {isPaused ? (
                <Button
                  onClick={resumeSimulation}
                  size="sm"
                  className="flex-1"
                  variant="default"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={pauseSimulation}
                  size="sm"
                  className="flex-1"
                  variant="secondary"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
              )}
              <Button
                onClick={stopSimulation}
                size="sm"
                variant="destructive"
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        // Compact Badge Mode
        <Button
          onClick={() => setIsExpanded(true)}
          className={cn(
            "h-10 px-3 bg-background/95 backdrop-blur-lg border border-primary/20 shadow-lg",
            "hover:bg-background hover:shadow-xl transition-all duration-300",
            isPaused && "border-warning/50"
          )}
          variant="outline"
        >
          <span className="text-base mr-2">{isPaused ? '⏸️' : '🎬'}</span>
          <span className="font-mono text-sm font-medium">
            {stats.activeOrders} • {formatCurrency(stats.revenue)}
          </span>
          <ChevronUp className="h-3 w-3 ml-2 opacity-50" />
        </Button>
      )}
    </div>
  );
}
