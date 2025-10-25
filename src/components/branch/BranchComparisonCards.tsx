import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ShoppingCart, Users } from 'lucide-react';
import { format } from 'date-fns';

interface BranchComparisonCardsProps {
  date?: Date;
}

export function BranchComparisonCards({ date = new Date() }: BranchComparisonCardsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['branch-comparison', format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_stats')
        .select(`
          *,
          branches(name, code)
        `)
        .eq('stat_date', format(date, 'yyyy-MM-dd'))
        .order('total_revenue', { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats?.map((stat, idx) => {
        const branch = stat.branches as any;
        const isTop = idx === 0;
        
        return (
          <Card key={stat.id} className={`p-6 ${isTop ? 'border-primary border-2' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{branch?.name}</h3>
                {branch?.code && (
                  <p className="text-sm text-muted-foreground">{branch.code}</p>
                )}
              </div>
              {isTop && (
                <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                  Top Branch
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="text-sm text-muted-foreground">Revenue</span>
                </div>
                <span className="font-semibold">RM {Number(stat.total_revenue).toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Orders</span>
                </div>
                <span className="font-semibold">{stat.total_orders}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  <span className="text-sm text-muted-foreground">Avg Ticket</span>
                </div>
                <span className="font-semibold">RM {Number(stat.avg_ticket).toFixed(2)}</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
