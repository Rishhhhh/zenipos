import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Clock, Star } from "lucide-react";
import { LazyAreaChart } from "@/components/charts/LazyAreaChart";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { RevenueChartConfig } from "@/types/widgetConfigs";
import { cn } from "@/lib/utils";

export default function RevenueChart() {
  const { config } = useWidgetConfig<RevenueChartConfig>('revenue-chart');
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ["revenue-chart"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("orders")
        .select("created_at, total")
        .gte("created_at", today.toISOString())
        .eq("status", "done");

      if (error) throw error;

      const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        revenue: 0,
      }));

      data?.forEach(order => {
        const hour = new Date(order.created_at).getHours();
        hourlyData[hour].revenue += Number(order.total);
      });

      const currentHour = new Date().getHours();
      const filteredData = hourlyData.filter((_, i) => 
        i >= Math.max(0, currentHour - 3) && i <= Math.min(23, currentHour + 3)
      );

      return filteredData;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const totalRevenue = revenueData?.reduce((sum, d) => sum + d.revenue, 0) || 0;
  const peakHour = revenueData?.reduce((max, d) => d.revenue > max.revenue ? d : max, { hour: '', revenue: 0 });

  return (
    <Card className={cn(
      "glass-card flex flex-col w-[480px] h-[360px]",
      config.compactMode ? "p-3" : "p-5"
    )}>
      <div className={cn(
        "flex items-center justify-between gap-2 flex-wrap",
        config.compactMode ? "mb-2" : "mb-4"
      )}>
        <div className="flex items-center gap-2">
          <TrendingUp className={cn(
            "text-primary",
            config.compactMode ? "h-4 w-4" : "h-5 w-5"
          )} />
          <h3 className={cn(
            "font-semibold",
            config.compactMode ? "text-base" : "text-lg"
          )}>
            Revenue Trend
          </h3>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {!config.compactMode && peakHour && peakHour.revenue > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-primary fill-primary" />
              <span>Peak: {peakHour.hour}</span>
            </div>
          )}
          <div className="text-right">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Today
            </p>
            <p className={cn(
              "font-bold text-primary",
              config.compactMode ? "text-base" : "text-lg"
            )}>
              RM {totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className={cn(
        config.compactMode ? "h-[316px]" : "h-[308px]"
      )}>
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-lg" />
        ) : (
          <LazyAreaChart
            data={revenueData || []}
            dataKey="revenue"
            xAxisKey="hour"
            height="100%"
            strokeColor="hsl(var(--primary))"
            fillColor="url(#revenueGradient)"
          />
        )}
      </div>
    </Card>
  );
}
