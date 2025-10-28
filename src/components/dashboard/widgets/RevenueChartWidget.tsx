import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Clock, Star } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { RevenueChartConfig } from "@/types/widgetConfigs";

export function RevenueChartWidget() {
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

      // Group by hour
      const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        revenue: 0,
      }));

      data?.forEach(order => {
        const hour = new Date(order.created_at).getHours();
        hourlyData[hour].revenue += Number(order.total);
      });

      // Only show hours with data or current hour +/- 3
      const currentHour = new Date().getHours();
      const filteredData = hourlyData.filter((_, i) => 
        i >= Math.max(0, currentHour - 3) && i <= Math.min(23, currentHour + 3)
      );

      return filteredData;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const totalRevenue = revenueData?.reduce((sum, d) => sum + d.revenue, 0) || 0;
  const peakHour = revenueData?.reduce((max, d) => d.revenue > max.revenue ? d : max, { hour: '', revenue: 0 });

  return (
    <Card className="glass-card p-5 min-h-[300px] min-w-[450px] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Revenue Trend</h3>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {peakHour && peakHour.revenue > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              <Star className="h-3.5 w-3.5 text-primary fill-primary" />
              <span>Peak: {peakHour.hour}</span>
            </div>
          )}
          <div className="text-right">
            <p className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
              <Clock className="h-3 w-3" />
              Today
            </p>
            <p className="text-xl font-bold text-primary whitespace-nowrap">
              RM {totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
              />
              <XAxis 
                dataKey="hour" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  padding: "8px 12px",
                }}
                formatter={(value: number) => [`RM ${value.toFixed(2)}`, "Revenue"]}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
                dot={config.showDataPoints ? { fill: "hsl(var(--primary))", r: 3 } : false}
                activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
