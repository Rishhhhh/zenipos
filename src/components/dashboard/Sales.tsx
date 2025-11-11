import { memo, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { MagicBento } from "@/components/ui/magic-bento";
import { startOfDay, subDays } from "date-fns";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { SalesWidgetConfig } from "@/types/widgetConfigs";
import { cn } from "@/lib/utils";
import { useRealtimeTable } from "@/lib/realtime/RealtimeService";

export default memo(function Sales() {
  const queryClient = useQueryClient();
  const { config } = useWidgetConfig<SalesWidgetConfig>('sales');
  
  // Real-time subscription for orders
  useRealtimeTable('orders', () => {
    queryClient.invalidateQueries({ queryKey: ["today-sales"] });
  });
  
  const getComparisonDate = useCallback(() => {
    const today = startOfDay(new Date());
    switch (config.comparisonPeriod) {
      case 'lastWeek':
        return subDays(today, 7);
      case 'lastMonth':
        return subDays(today, 30);
      default: // 'yesterday'
        return subDays(today, 1);
    }
  }, [config.comparisonPeriod]);

  const { data: todayStats, isLoading, refetch } = useQuery({
    queryKey: ["today-sales", config.comparisonPeriod],
    queryFn: async () => {
      console.log('[Sales Widget] Fetching data...');
      const today = startOfDay(new Date());
      const comparisonDate = getComparisonDate();

      const { data: todayOrders, error: todayError } = await supabase
        .from("orders")
        .select("total, order_items(quantity), status")
        .gte("created_at", today.toISOString())
        .in("status", ["done", "preparing", "pending"]);

      if (todayError) {
        console.error('[Sales Widget] Today query error:', todayError);
        throw todayError;
      }

      console.log('[Sales Widget] Today orders:', {
        total: todayOrders?.length,
        statuses: todayOrders?.map(o => o.status),
        revenue: todayOrders?.reduce((sum, o) => sum + o.total, 0)
      });

      const { data: comparisonOrders, error: comparisonError } = await supabase
        .from("orders")
        .select("total")
        .gte("created_at", comparisonDate.toISOString())
        .lt("created_at", today.toISOString())
        .in("status", ["done"]);

      if (comparisonError) {
        console.error('[Sales Widget] Comparison query error:', comparisonError);
        throw comparisonError;
      }

      const todayRevenue = todayOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const todayOrderCount = todayOrders?.length || 0;
      const todayItemCount = todayOrders?.reduce(
        (sum, order) =>
          sum + (order.order_items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0),
        0
      ) || 0;

      const comparisonRevenue = comparisonOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const comparisonOrderCount = comparisonOrders?.length || 0;

      const revenueTrend = comparisonRevenue > 0 
        ? ((todayRevenue - comparisonRevenue) / comparisonRevenue) * 100 
        : 0;
      const orderTrend = comparisonOrderCount > 0 
        ? ((todayOrderCount - comparisonOrderCount) / comparisonOrderCount) * 100 
        : 0;

      console.log('[Sales Widget] Stats calculated:', { todayRevenue, todayOrderCount, todayItemCount });

      return {
        revenue: todayRevenue,
        orders: todayOrderCount,
        items: todayItemCount,
        revenueTrend,
        orderTrend,
      };
    },
    refetchInterval: config.refreshInterval * 1000,
  });

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  const revenue = useMemo(() => todayStats?.revenue || 0, [todayStats?.revenue]);
  const orders = useMemo(() => todayStats?.orders || 0, [todayStats?.orders]);
  const items = useMemo(() => todayStats?.items || 0, [todayStats?.items]);
  const revenueTrend = useMemo(() => todayStats?.revenueTrend || 0, [todayStats?.revenueTrend]);
  const orderTrend = useMemo(() => todayStats?.orderTrend || 0, [todayStats?.orderTrend]);

  return (
    <Card className={cn(
      "glass-card flex flex-col w-full h-full",
      config.compactMode ? "p-3" : "p-4"
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Today's Sales</h3>
        <Button
          onClick={handleRefetch}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-lg animate-shimmer bg-muted/30",
                  config.compactMode ? "h-[58px]" : "h-[72px]"
                )}
              />
            ))}
          </div>
        ) : config.displayType === 'table' ? (
          <div className="space-y-2.5 animate-fade-in">
          <div className={cn(
            "flex items-center justify-between bg-accent/30 rounded-lg",
            config.compactMode ? "p-2.5" : "p-3.5"
          )}>
            <div className="flex-1 min-w-0">
              <p className={cn("text-muted-foreground", config.compactMode ? "text-xs" : "text-sm")}>
                Revenue
              </p>
              <p className={cn(
                "font-bold text-primary truncate",
                config.compactMode ? "text-base" : "text-xl"
              )}>
                RM {revenue.toFixed(2)}
              </p>
            </div>
            {config.showTrends && (
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                {revenueTrend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger" />
                )}
                <span className={cn(
                  "font-semibold",
                  revenueTrend >= 0 ? "text-success" : "text-danger"
                )}>
                  {Math.abs(revenueTrend).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className={cn(
            "flex items-center justify-between bg-accent/30 rounded-lg",
            config.compactMode ? "p-2.5" : "p-3.5"
          )}>
            <div className="flex-1 min-w-0">
              <p className={cn("text-muted-foreground", config.compactMode ? "text-xs" : "text-sm")}>Orders</p>
              <p className={cn("font-bold truncate", config.compactMode ? "text-base" : "text-xl")}>
                {orders}
              </p>
            </div>
            {config.showTrends && (
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                {orderTrend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger" />
                )}
                <span className={cn(
                  "font-semibold",
                  orderTrend >= 0 ? "text-success" : "text-danger"
                )}>
                  {Math.abs(orderTrend).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className={cn(
            "flex items-center justify-between bg-accent/30 rounded-lg",
            config.compactMode ? "p-2.5" : "p-3.5"
          )}>
            <div className="flex-1 min-w-0">
              <p className={cn("text-muted-foreground", config.compactMode ? "text-xs" : "text-sm")}>Items Sold</p>
              <p className={cn("font-bold truncate", config.compactMode ? "text-base" : "text-xl")}>
                {items}
              </p>
            </div>
          </div>

          {config.goalTracking?.enabled && config.goalTracking.dailyTarget > 0 && (
            <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Daily Goal</span>
                <span className="text-sm font-bold text-primary">RM {config.goalTracking.dailyTarget}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min((revenue / config.goalTracking.dailyTarget) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((revenue / config.goalTracking.dailyTarget) * 100).toFixed(1)}% of goal
              </p>
            </div>
          )}
        </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 h-full animate-fade-in-content">
          <MagicBento
            title="Revenue"
            value={`RM ${todayStats?.revenue.toFixed(2) || "0.00"}`}
            trend={{
              value: todayStats?.revenueTrend || 0,
              isPositive: (todayStats?.revenueTrend || 0) >= 0,
            }}
            subtitle="Total earnings today"
            threshold={{ warning: 1000, danger: 500 }}
          />
          <MagicBento
            title="Orders"
            value={todayStats?.orders.toString() || "0"}
            trend={{
              value: todayStats?.orderTrend || 0,
              isPositive: (todayStats?.orderTrend || 0) >= 0,
            }}
            subtitle="Completed orders"
            threshold={{ warning: 20, danger: 10 }}
          />
          <MagicBento
            title="Items Sold"
            value={todayStats?.items.toString() || "0"}
            subtitle="Total items today"
            threshold={{ warning: 50, danger: 20 }}
          />
          </div>
        )}
      </div>

      {config.showTrendFooter && todayStats && (
        <div className={cn(
          "pt-4 border-t border-border/50",
          config.compactMode ? "mt-2" : "mt-4"
        )}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {todayStats.revenueTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger" />
              )}
              <span className="text-muted-foreground">
                Revenue {todayStats.revenueTrend >= 0 ? "up" : "down"}{" "}
                {Math.abs(todayStats.revenueTrend).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              {todayStats.orderTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger" />
              )}
              <span className="text-muted-foreground">
                Orders {todayStats.orderTrend >= 0 ? "up" : "down"}{" "}
                {Math.abs(todayStats.orderTrend).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
});
