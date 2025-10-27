import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export function RevenueChartWidget() {
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

  return (
    <Card className="glass-card p-4 h-full w-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-base">Revenue Chart</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="text-lg font-bold text-primary">
            RM {totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="hour" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`RM ${value.toFixed(2)}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
