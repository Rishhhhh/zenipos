import { memo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Award, Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { LoyaltyStatsConfig } from "@/types/widgetConfigs";
import { cn } from "@/lib/utils";
import * as ReactWindow from 'react-window';
const FixedSizeList = (ReactWindow as any).FixedSizeList;

interface CustomerRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    customers: any[];
    getMedalIcon: (index: number) => any;
    compactMode: boolean;
  };
}

export default memo(function LoyaltyStats() {
  const { config } = useWidgetConfig<LoyaltyStatsConfig>('loyalty-stats');
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["loyalty-stats", config.topNCustomers],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: transactions, error: txError } = await supabase
        .from("loyalty_ledger")
        .select("points_delta, customer_id")
        .gte("created_at", today.toISOString());

      if (txError) throw txError;

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

  const getMedalIcon = useCallback((index: number) => {
    if (index === 0) return { emoji: "🥇", color: "text-yellow-500" };
    if (index === 1) return { emoji: "🥈", color: "text-gray-400" };
    if (index === 2) return { emoji: "🥉", color: "text-amber-600" };
    return { emoji: "🏅", color: "text-muted-foreground" };
  }, []);

  const CustomerRow = memo(({ index, style, data }: CustomerRowProps) => {
    const customer = data.customers[index];
    const medal = data.getMedalIcon(index);
    
    return (
      <div style={{ ...style, paddingBottom: '6px' }}>
        <div className={cn("flex items-center justify-between rounded-lg border bg-card/50 h-10", data.compactMode ? "px-2 py-1.5" : "px-3 py-2")}>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className={cn("flex-shrink-0", data.compactMode ? "text-base" : "text-lg")}>{medal.emoji}</span>
            <p className={cn("font-semibold line-clamp-1", data.compactMode ? "text-[13px]" : "text-sm")}>{customer.name || "Unknown"}</p>
          </div>
          <p className={cn("font-bold text-primary flex-shrink-0 ml-2", data.compactMode ? "text-base" : "text-lg")}>{customer.loyalty_points.toLocaleString()}</p>
        </div>
      </div>
    );
  });

  return (
    <Card className={cn("glass-card flex flex-col w-full h-full", config.compactMode ? "p-3" : "p-4")}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Loyalty Stats</h3>
      </div>

      <div className="space-y-3 flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className={cn("rounded-lg animate-shimmer border border-primary/20", config.compactMode ? "h-[68px]" : "h-[80px]")} />
              <div className={cn("rounded-lg animate-shimmer border border-border/50", config.compactMode ? "h-[68px]" : "h-[80px]")} />
            </div>
            <div className="space-y-2">
              <div className={cn("rounded animate-shimmer", config.compactMode ? "h-4" : "h-4")} />
              {Array.from({ length: config.compactMode ? 3 : 5 }).map((_, i) => (
                <div key={i} className="h-[46px] rounded-lg animate-shimmer border border-border/50" />
              ))}
            </div>
          </>
        ) : (
          <div className="animate-fade-in-content">
            <div className="grid grid-cols-2 gap-3">
              <div className={cn("rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent", config.compactMode ? "p-2" : "p-3")}>
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">{config.compactMode ? "Points" : "Points Today"}</p>
                </div>
                <p className={cn("font-bold text-primary", config.compactMode ? "text-xl" : "text-2xl")}>{stats?.totalPoints || 0}</p>
              </div>
              <div className={cn("rounded-lg border border-border/50 bg-gradient-to-br from-accent/50 to-transparent", config.compactMode ? "p-2" : "p-3")}>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4" />
                  <p className="text-xs text-muted-foreground">Customers</p>
                </div>
                <p className={cn("font-bold", config.compactMode ? "text-xl" : "text-2xl")}>{stats?.uniqueCustomers || 0}</p>
              </div>
            </div>

            <div className="flex-1 min-h-0 space-y-2">
              <h4 className={cn("font-medium text-muted-foreground mb-2", config.compactMode ? "text-xs" : "text-sm")}>Top Customers</h4>
              {!stats?.topCustomers || stats.topCustomers.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-muted-foreground">
                  <Users className="h-6 w-6 mr-2 opacity-50" />
                  <p className="text-xs">No customers yet</p>
                </div>
              ) : (
                <FixedSizeList
                  height={160}
                  itemCount={stats.topCustomers.slice(0, config.compactMode ? 5 : 10).length}
                  itemSize={46}
                  width="100%"
                  itemData={{
                    customers: stats.topCustomers.slice(0, config.compactMode ? 5 : 10),
                    getMedalIcon,
                    compactMode: config.compactMode
                  }}
                >
                  {CustomerRow}
                </FixedSizeList>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});
