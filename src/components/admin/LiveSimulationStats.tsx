import { Card } from '@/components/ui/card';
import { SimulationStats } from '@/lib/simulation/types';
import { TrendingUp, Clock, Users, DollarSign, ChefHat, Zap } from 'lucide-react';

interface LiveSimulationStatsProps {
  stats: SimulationStats;
}

export function LiveSimulationStats({ stats }: LiveSimulationStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">Active Orders</span>
        </div>
        <div className="text-2xl font-bold">{stats.activeOrders}</div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <ChefHat className="h-4 w-4 text-orange-500" />
          <span className="text-xs text-muted-foreground">Kitchen Queue</span>
        </div>
        <div className="text-2xl font-bold">{stats.kitchenQueue}</div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-blue-500" />
          <span className="text-xs text-muted-foreground">Dining</span>
        </div>
        <div className="text-2xl font-bold">{stats.customersDining}</div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-green-500" />
          <span className="text-xs text-muted-foreground">Revenue</span>
        </div>
        <div className="text-2xl font-bold">RM {stats.revenue.toFixed(2)}</div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-4 w-4 text-purple-500" />
          <span className="text-xs text-muted-foreground">Orders/Hour</span>
        </div>
        <div className="text-2xl font-bold">{stats.ordersPerHour.toFixed(1)}</div>
      </Card>

      <Card className={`p-4 ${stats.isPeakHour ? 'bg-warning/10 border-warning/20' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <Zap className={`h-4 w-4 ${stats.isPeakHour ? 'text-warning' : 'text-muted-foreground'}`} />
          <span className="text-xs text-muted-foreground">Status</span>
        </div>
        <div className="text-sm font-bold">
          {stats.isPeakHour ? '🔥 Peak Hour' : '✓ Normal'}
        </div>
      </Card>
    </div>
  );
}
