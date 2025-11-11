import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, ShoppingBag, Package, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { MagicBento } from "@/components/ui/magic-bento";
import { startOfDay, subDays } from "date-fns";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { SalesWidgetConfig } from "@/types/widgetConfigs";
import { cn } from "@/lib/utils";

export function SalesWidget() {
  const { config } = useWidgetConfig<SalesWidgetConfig>('sales');
  
  const { data: todayStats, isLoading, refetch } = useQuery({
    queryKey: ["today-sales"],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const yesterday = startOfDay(subDays(new Date(), 1));

      // Fetch today's orders
      const { data: todayOrders, error: todayError } = await supabase
        .from("orders")
        .select("total, order_items(quantity)")
        .gte("created_at", today.toISOString())
        .in("status", ["done", "preparing", "pending"]);

      if (todayError) throw todayError;

      // Fetch yesterday's orders for comparison
      const { data: yesterdayOrders, error: yesterdayError } = await supabase
        .from("orders")
        .select("total")
        .gte("created_at", yesterday.toISOString())
        .lt("created_at", today.toISOString())
        .in("status", ["done"]);

      if (yesterdayError) throw yesterdayError;

      // Calculate today's metrics
      const todayRevenue = todayOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const todayOrderCount = todayOrders?.length || 0;
      const todayItemCount = todayOrders?.reduce(
        (sum, order) =>
          sum + (order.order_items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0),
        0
      ) || 0;

      // Calculate yesterday's metrics
      const yesterdayRevenue = yesterdayOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const yesterdayOrderCount = yesterdayOrders?.length || 0;

      // Calculate trends
      const revenueTrend = yesterdayRevenue > 0 
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
        : 0;
      const orderTrend = yesterdayOrderCount > 0 
        ? ((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount) * 100 
        : 0;

      return {
        revenue: todayRevenue,
        orders: todayOrderCount,
        items: todayItemCount,
        revenueTrend,
        orderTrend,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <Card className={cn(
      "glass-card flex flex-col w-full h-full",
      config.compactMode ? "p-3" : "p-4"
    )}>
      {/* Header */}
      <div className="flex items-center justify-end mb-2">
        <Button
          onClick={() => refetch()}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Metrics Display */}
      <div className={cn(
        "overflow-y-auto",
        config.showTrendFooter ? "h-[208px]" : "h-[256px]"
      )}>
        {isLoading ? (
          <div className={cn("grid gap-4", config.displayType === 'table' ? "grid-cols-1" : "grid-cols-3")}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-accent/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : config.displayType === 'table' ? (
          <div className="space-y-2 h-full overflow-y-auto">
          <div className={cn("flex items-center justify-between bg-accent/30 rounded-lg", config.compactMode ? "p-2" : "p-3")}>
            <div>
              <p className={cn("text-muted-foreground", config.compactMode ? "text-xs" : "text-sm")}>Revenue</p>
              <p className={cn("font-bold text-primary", config.compactMode ? "text-lg" : "text-2xl")}>
                RM {todayStats?.revenue.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              {(todayStats?.revenueTrend || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger" />
              )}
              <span className={cn((todayStats?.revenueTrend || 0) >= 0 ? "text-success" : "text-danger")}>
                {Math.abs(todayStats?.revenueTrend || 0).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className={cn("flex items-center justify-between bg-accent/30 rounded-lg", config.compactMode ? "p-2" : "p-3")}>
            <div>
              <p className={cn("text-muted-foreground", config.compactMode ? "text-xs" : "text-sm")}>Orders</p>
              <p className={cn("font-bold", config.compactMode ? "text-lg" : "text-2xl")}>
                {todayStats?.orders || 0}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              {(todayStats?.orderTrend || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger" />
              )}
              <span className={cn((todayStats?.orderTrend || 0) >= 0 ? "text-success" : "text-danger")}>
                {Math.abs(todayStats?.orderTrend || 0).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className={cn("flex items-center justify-between bg-accent/30 rounded-lg", config.compactMode ? "p-2" : "p-3")}>
            <div>
              <p className={cn("text-muted-foreground", config.compactMode ? "text-xs" : "text-sm")}>Items Sold</p>
              <p className={cn("font-bold", config.compactMode ? "text-lg" : "text-2xl")}>
                {todayStats?.items || 0}
              </p>
            </div>
          </div>
        </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 h-full">
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

      {/* Trend Indicators Footer - Optional */}
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
}
