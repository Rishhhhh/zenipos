import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Award, Gift, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { LoyaltyStatsConfig } from "@/types/widgetConfigs";
import { cn } from "@/lib/utils";

export function LoyaltyStatsWidget() {
  const { config } = useWidgetConfig<LoyaltyStatsConfig>('loyalty-stats');
  
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["loyalty-stats", config.topNCustomers],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's loyalty transactions
      const { data: transactions, error: txError } = await supabase
        .from("loyalty_ledger")
        .select("points_delta, customer_id")
        .gte("created_at", today.toISOString());

      if (txError) throw txError;

      // Get top customers - USE CONFIG VALUE
      const { data: topCustomers, error: custError } = await supabase
        .from("customers")
        .select("name, loyalty_points")
        .order("loyalty_points", { ascending: false })
        .limit(config.topNCustomers);

      if (custError) throw custError;

      const totalPoints = transactions?.reduce((sum, t) => sum + t.points_delta, 0) || 0;
      const uniqueCustomers = new Set(transactions?.map(t => t.customer_id)).size;

      return {
        totalPoints,
        uniqueCustomers,
        topCustomers: topCustomers || [],
      };
    },
    refetchInterval: config.refreshInterval * 1000,
  });

  const getMedalIcon = (index: number) => {
    if (index === 0) return { emoji: "🥇", color: "text-yellow-500" };
    if (index === 1) return { emoji: "🥈", color: "text-gray-400" };
    if (index === 2) return { emoji: "🥉", color: "text-amber-600" };
    return { emoji: "🏅", color: "text-muted-foreground" };
  };

  return (
    <Card className={cn(
      "glass-card flex flex-col w-full h-full",
      config.compactMode ? "p-3" : "p-4"
    )}>
      {/* Header */}
      <div className="flex items-center justify-end mb-3">
      </div>

      <div className={cn(
        "space-y-3",
        config.compactMode ? "h-[244px]" : "h-[240px]"
      )}>
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : (
          <>
            {/* Stats Summary - COMPACT CARDS */}
            <div className="grid grid-cols-2 gap-3">
              <div className={cn(
                "rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent",
                config.compactMode ? "p-2" : "p-3"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    {config.compactMode ? "Points" : "Points Today"}
                  </p>
                </div>
                <p className={cn(
                  "font-bold text-primary",
                  config.compactMode ? "text-xl" : "text-2xl"
                )}>
                  {stats?.totalPoints || 0}
                </p>
              </div>
              <div className={cn(
                "rounded-lg border border-border/50 bg-gradient-to-br from-accent/50 to-transparent",
                config.compactMode ? "p-2" : "p-3"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4" />
                  <p className="text-xs text-muted-foreground">Customers</p>
                </div>
                <p className={cn(
                  "font-bold",
                  config.compactMode ? "text-xl" : "text-2xl"
                )}>
                  {stats?.uniqueCustomers || 0}
                </p>
              </div>
            </div>

            {/* Top Customers */}
            <div className="flex-1 min-h-0 space-y-2">
              <h4 className={cn(
                "font-medium text-muted-foreground mb-2",
                config.compactMode ? "text-xs" : "text-sm"
              )}>
                Top Customers
              </h4>
              {stats?.topCustomers && stats.topCustomers.length > 0 ? (
                <div className="space-y-1.5 overflow-y-auto max-h-[160px]">
                  {stats.topCustomers.slice(0, config.compactMode ? 5 : 10).map((customer, index) => {
                    const medal = getMedalIcon(index);
                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center justify-between rounded-lg border bg-card/50 h-10",
                          config.compactMode ? "px-2 py-1.5" : "px-3 py-2"
                        )}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className={cn(
                            "flex-shrink-0",
                            config.compactMode ? "text-base" : "text-lg"
                          )}>
                            {medal.emoji}
                          </span>
                          <p className={cn(
                            "font-semibold line-clamp-1",
                            config.compactMode ? "text-[13px]" : "text-sm"
                          )}>
                            {customer.name || "Unknown"}
                          </p>
                        </div>
                        <p className={cn(
                          "font-bold text-primary flex-shrink-0 ml-2",
                          config.compactMode ? "text-base" : "text-lg"
                        )}>
                          {customer.loyalty_points.toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-20 text-muted-foreground">
                  <Users className="h-6 w-6 mr-2 opacity-50" />
                  <p className="text-xs">No customers yet</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
