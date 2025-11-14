import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Percent, Target } from 'lucide-react';
import { LazyBarChart } from '@/components/charts/LazyBarChart';
import { useBranch } from '@/contexts/BranchContext';

export default function PromotionAnalytics() {
  const { currentBranch } = useBranch();

  // Fetch promotion usage statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['promotion-analytics', currentBranch?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotion_usage')
        .select(`
          *,
          promotion:promotions(id, name, type, active),
          order:orders(id, total, branch_id)
        `)
        .not('promotion', 'is', null);

      if (error) throw error;

      // Filter by branch
      const filtered = currentBranch?.id
        ? data.filter(item => item.order?.branch_id === currentBranch.id)
        : data;

      // Calculate KPIs
      const totalUsage = filtered.length;
      const totalDiscount = filtered.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
      const avgDiscount = totalUsage > 0 ? totalDiscount / totalUsage : 0;

      // Group by promotion
      const byPromotion = filtered.reduce((acc, item) => {
        const promoId = item.promotion?.id;
        if (!promoId) return acc;

        if (!acc[promoId]) {
          acc[promoId] = {
            id: promoId,
            name: item.promotion.name,
            type: item.promotion.type,
            active: item.promotion.active,
            usage_count: 0,
            total_discount: 0,
          };
        }

        acc[promoId].usage_count += 1;
        acc[promoId].total_discount += item.discount_amount || 0;

        return acc;
      }, {} as Record<string, any>);

      const promotionStats = Object.values(byPromotion).map((p: any) => ({
        ...p,
        avg_discount: p.usage_count > 0 ? p.total_discount / p.usage_count : 0,
      }));

      // Active promotions count
      const activePromotionsQuery = await supabase
        .from('promotions')
        .select('id', { count: 'exact', head: true })
        .eq('active', true);

      return {
        totalUsage,
        totalDiscount,
        avgDiscount,
        activePromotions: activePromotionsQuery.count || 0,
        promotionStats: promotionStats.sort((a, b) => b.usage_count - a.usage_count),
      };
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Promotion Analytics</h1>
          <p className="text-muted-foreground">Track promotion effectiveness and usage</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">{stats?.totalUsage || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Discount</p>
                <p className="text-2xl font-bold">RM {(stats?.totalDiscount || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Discount</p>
                <p className="text-2xl font-bold">RM {(stats?.avgDiscount || 0).toFixed(2)}</p>
              </div>
              <Percent className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Promotions</p>
                <p className="text-2xl font-bold">{stats?.activePromotions || 0}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Usage Chart */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Usage by Promotion</h2>
          {stats?.promotionStats && stats.promotionStats.length > 0 ? (
            <LazyBarChart
              data={stats.promotionStats.slice(0, 10).map(p => ({
                name: p.name,
                value: p.usage_count,
              }))}
              dataKey="value"
              height={300}
            />
          ) : (
            <p className="text-center text-muted-foreground py-12">No promotion usage data yet</p>
          )}
        </Card>

        {/* Performance Table */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Promotion Performance</h2>
          {stats?.promotionStats && stats.promotionStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Promotion</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-right py-3 px-4">Usage Count</th>
                    <th className="text-right py-3 px-4">Total Discount</th>
                    <th className="text-right py-3 px-4">Avg Discount</th>
                    <th className="text-center py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.promotionStats.map((promo) => (
                    <tr key={promo.id} className="border-b">
                      <td className="py-3 px-4 font-medium">{promo.name}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{promo.type}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">{promo.usage_count}</td>
                      <td className="py-3 px-4 text-right">RM {promo.total_discount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">RM {promo.avg_discount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={promo.active ? 'default' : 'secondary'}>
                          {promo.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">No promotion data available</p>
          )}
        </Card>
      </div>
    </div>
  );
}
