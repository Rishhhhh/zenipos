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
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["loyalty-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's loyalty transactions
      const { data: transactions, error: txError } = await supabase
        .from("loyalty_ledger")
        .select("points_delta, customer_id")
        .gte("created_at", today.toISOString());

      if (txError) throw txError;

      // Get top customers
      const { data: topCustomers, error: custError } = await supabase
        .from("customers")
        .select("name, loyalty_points")
        .order("loyalty_points", { ascending: false })
        .limit(3);

      if (custError) throw custError;

      const totalPoints = transactions?.reduce((sum, t) => sum + t.points_delta, 0) || 0;
      const uniqueCustomers = new Set(transactions?.map(t => t.customer_id)).size;

      return {
        totalPoints,
        uniqueCustomers,
        topCustomers: topCustomers || [],
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const getPodiumColor = (index: number) => {
    if (index === 0) return { bg: "from-yellow-500/20", border: "border-yellow-500/40", icon: "text-yellow-500" };
    if (index === 1) return { bg: "from-gray-400/20", border: "border-gray-400/40", icon: "text-gray-400" };
    if (index === 2) return { bg: "from-amber-600/20", border: "border-amber-600/40", icon: "text-amber-600" };
    return { bg: "from-accent/20", border: "border-border/40", icon: "text-muted-foreground" };
  };

  return (
    <Card className="glass-card p-5 min-h-[300px] min-w-[350px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Award className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Loyalty Stats</h3>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-primary/10 to-transparent rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Points Today</p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {stats?.totalPoints || 0}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-accent/50 to-transparent rounded-lg border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-foreground" />
                  <p className="text-xs text-muted-foreground">Customers</p>
                </div>
                <p className="text-2xl font-bold">{stats?.uniqueCustomers || 0}</p>
              </div>
            </div>

            {/* Top Customers Podium */}
            {stats?.topCustomers && stats.topCustomers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Top Customers</h4>
                </div>
                <div className="space-y-2.5">
                  {stats.topCustomers.slice(0, config.topNCustomers).map((customer, index) => {
                    const colors = getPodiumColor(index);
                    return (
                      <div
                        key={index}
                        className={cn(
                          "p-3 rounded-lg border bg-gradient-to-r to-transparent transition-all hover:shadow-md",
                          colors.bg,
                          colors.border
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background/80 border border-border/50 flex-shrink-0">
                            <Award className={cn("h-4 w-4", colors.icon)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm line-clamp-1">
                                  {customer.name || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Rank #{index + 1}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">
                                  {customer.loyalty_points}
                                </p>
                                <p className="text-xs text-muted-foreground">points</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
