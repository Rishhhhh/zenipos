import { memo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Users, ChefHat, CreditCard, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRealtimeTable } from '@/lib/realtime/RealtimeService';
import { cn } from '@/lib/utils';
import { useWidgetRefresh } from '@/contexts/WidgetRefreshContext';

interface FlowStat {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

const StatCard = memo(function StatCard({ stat }: { stat: FlowStat }) {
  const Icon = stat.icon;
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-xl p-4 transition-all duration-300",
      "border border-border/50 hover:border-border",
      stat.bgColor
    )}>
      <div className={cn("p-2.5 rounded-full mb-2", stat.color)}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-2xl font-bold text-foreground">{stat.value}</span>
      <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
    </div>
  );
});

export default memo(function LiveFlow() {
  const queryClient = useQueryClient();
  const { registerRefresh } = useWidgetRefresh();

  const { data: flowStats, isLoading, refetch } = useQuery({
    queryKey: ['live-flow-widget'],
    queryFn: async () => {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('orders')
        .select('id, status, order_type')
        .not('status', 'eq', 'cancelled')
        .is('metadata->simulated', null)
        .gte('created_at', fourHoursAgo)
        .limit(200);

      if (error) throw error;

      // Group by status
      const statusCounts = (data || []).reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate meaningful stats
      const dineInActive = (data || []).filter(o => 
        o.order_type === 'dine_in' && 
        ['confirmed', 'preparing', 'ready', 'served'].includes(o.status)
      ).length;

      const inKitchen = (statusCounts['preparing'] || 0);
      const pendingPayment = (statusCounts['served'] || 0) + (statusCounts['ready'] || 0);
      const readyPickup = (data || []).filter(o => 
        o.order_type === 'takeaway' && o.status === 'ready'
      ).length;

      return {
        customersInHouse: dineInActive,
        inKitchen,
        pendingPayment,
        readyPickup,
        totalActive: dineInActive + inKitchen + pendingPayment + readyPickup
      };
    },
    refetchInterval: 10000,
  });

  // Real-time subscription
  useRealtimeTable('orders', () => {
    queryClient.invalidateQueries({ queryKey: ['live-flow-widget'] });
  });

  // Register refetch function
  useEffect(() => {
    registerRefresh(refetch);
  }, [refetch, registerRefresh]);

  const stats: FlowStat[] = [
    {
      icon: Users,
      label: 'Dine-In',
      value: flowStats?.customersInHouse || 0,
      color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/5 hover:bg-emerald-500/10',
    },
    {
      icon: ChefHat,
      label: 'In Kitchen',
      value: flowStats?.inKitchen || 0,
      color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/5 hover:bg-amber-500/10',
    },
    {
      icon: CreditCard,
      label: 'Pending Pay',
      value: flowStats?.pendingPayment || 0,
      color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/5 hover:bg-blue-500/10',
    },
    {
      icon: Package,
      label: 'Ready Pickup',
      value: flowStats?.readyPickup || 0,
      color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/5 hover:bg-purple-500/10',
    },
  ];

  return (
    <Card className="glass-card flex flex-col w-full h-full p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Restaurant Flow</h3>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {isLoading ? (
          <div className="grid grid-cols-4 gap-3 w-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 w-full">
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
});
