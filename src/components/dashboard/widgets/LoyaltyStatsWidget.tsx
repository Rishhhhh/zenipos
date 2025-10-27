import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { cn } from "@/lib/utils";

export function LoyaltyStatsWidget() {
  const { config } = useWidgetConfig('loyalty-stats');
  
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

  return (
    <Card className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-base">Loyalty Stats</h3>
      </div>

      <div className="flex-1 space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : (
          <>
            {/* Stats Summary */}
            {config.displayType === 'cards' ? (
              <div className={cn("grid gap-2", config.compactMode ? "grid-cols-2" : "grid-cols-2")}>
                <div className={cn("bg-primary/10 rounded-lg", config.compactMode ? "p-1.5" : "p-2")}>
                  <p className="text-xs text-muted-foreground mb-1">Points Today</p>
                  <p className={cn("font-bold text-primary", config.compactMode ? "text-base" : "text-lg")}>
                    {stats?.totalPoints || 0}
                  </p>
                </div>
                <div className={cn("bg-accent/50 rounded-lg", config.compactMode ? "p-1.5" : "p-2")}>
                  <p className="text-xs text-muted-foreground mb-1">Customers</p>
                  <p className={cn("font-bold", config.compactMode ? "text-base" : "text-lg")}>{stats?.uniqueCustomers || 0}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between p-1.5 bg-accent/30 rounded text-xs">
                  <span className="text-muted-foreground">Points Today</span>
                  <span className="font-semibold text-primary">{stats?.totalPoints || 0}</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-accent/30 rounded text-xs">
                  <span className="text-muted-foreground">Active Customers</span>
                  <Badge variant="outline" className="text-[10px] h-4">{stats?.uniqueCustomers || 0}</Badge>
                </div>
              </div>
            )}

            {/* Top Customers */}
            {stats?.topCustomers && stats.topCustomers.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Top Customers
                </p>
                <div className="space-y-1">
                  {stats.topCustomers.map((customer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-1.5 bg-accent/30 rounded"
                    >
                      <span className="text-xs font-medium truncate flex-1">
                        {index + 1}. {customer.name || "Unknown"}
                      </span>
                      <span className="text-xs font-semibold text-primary ml-2">
                        {customer.loyalty_points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
