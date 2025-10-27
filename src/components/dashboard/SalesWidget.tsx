import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { MagicBento } from "@/components/ui/magic-bento";
import { startOfDay, subDays } from "date-fns";

export function SalesWidget() {
  const { data: todayStats, isLoading, refetch } = useQuery({
    queryKey: ["today-sales"],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const yesterday = startOfDay(subDays(new Date(), 1));

      // Fetch today's orders
      const { data: todayOrders, error: todayError } = await supabase
        .from("orders")
        .select("total, order_items(qty)")
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
          sum + (order.order_items?.reduce((itemSum: number, item: any) => itemSum + item.qty, 0) || 0),
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
    <Card className="glass-card p-5 h-full flex flex-col lg:col-span-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Today's Sales</h3>
        </div>
        <Button
          onClick={() => refetch()}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Metrics Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-accent/50 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Revenue */}
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

          {/* Orders */}
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

          {/* Items Sold */}
          <MagicBento
            title="Items Sold"
            value={todayStats?.items.toString() || "0"}
            subtitle="Total items today"
            threshold={{ warning: 50, danger: 20 }}
          />
        </div>
      )}

      {/* Trend Indicators */}
      {todayStats && (
        <div className="mt-4 pt-4 border-t border-border/50">
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
