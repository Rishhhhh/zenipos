import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getRecentCompletedOrders } from '@/lib/queries/tableQueries';
import { Skeleton } from '@/components/ui/skeleton';

export function TableHistoryPanel() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['recent-completed-orders'],
    queryFn: () => getRecentCompletedOrders(),
    refetchInterval: 10000, // Auto-refresh every 10s
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recently Completed</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))
            ) : Array.isArray(orders) && orders.length > 0 ? (
              orders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-start justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-success mt-1" />
                    <div>
                      <p className="font-medium text-sm">
                        Table {order.tables?.label || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.paid_at && formatDistanceToNow(new Date(order.paid_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    RM {order.total.toFixed(2)}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">
                No completed orders yet
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
