import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/lib/realtime/RealtimeService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, DollarSign, Store } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LiveOrdersFeedProps {
  branchId?: string | null;
  limit?: number;
}

export function LiveOrdersFeed({ branchId, limit = 20 }: LiveOrdersFeedProps) {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['live-orders', branchId],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          branches(name, code)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (branchId && branchId !== 'all') {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  // Real-time subscription using unified service
  useRealtimeTable('orders', () => {
    queryClient.invalidateQueries({ queryKey: ['live-orders'] });
  });

  if (isLoading) {
    return <div className="h-96 animate-pulse bg-muted rounded" />;
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Live Orders</h3>
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {orders?.map((order) => {
            const branch = order.branches as any;
            const statusColors = {
              pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
              confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
              preparing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
              completed: 'bg-success/20 text-success',
              cancelled: 'bg-destructive/20 text-destructive',
            };

            return (
              <div
                key={order.id}
                className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">
                      {branch?.name} {branch?.code && `(${branch.code})`}
                    </span>
                  </div>
                  <Badge className={statusColors[order.status as keyof typeof statusColors] || ''}>
                    {order.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(order.created_at))} ago</span>
                    </div>
                    <div className="flex items-center gap-1 text-success">
                      <DollarSign className="h-3 w-3" />
                      <span>RM {Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
