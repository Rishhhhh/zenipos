import { memo, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Award, Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { LoyaltyStatsConfig } from "@/types/widgetConfigs";
import { cn } from "@/lib/utils";
import { useRealtimeTable } from "@/lib/realtime/RealtimeService";
import { useWidgetRefresh } from "@/contexts/WidgetRefreshContext";

export default memo(function LoyaltyStats() {
  const queryClient = useQueryClient();
  const { config } = useWidgetConfig<LoyaltyStatsConfig>('loyalty-stats');
  const { registerRefresh } = useWidgetRefresh();
  
  // Real-time subscription for loyalty transactions
  useRealtimeTable('loyalty_ledger', () => {
    queryClient.invalidateQueries({ queryKey: ["loyalty-stats"] });
  });
  
  // Also subscribe to customer updates (for points balance)
  useRealtimeTable('customers', () => {
    queryClient.invalidateQueries({ queryKey: ["loyalty-stats"] });
  });
  
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["loyalty-stats", config.topNCustomers],
    queryFn: async () => {
      console.log('[LoyaltyStats] Fetching data...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: transactions, error: txError } = await supabase
        .from("loyalty_ledger")
        .select("points_delta, customer_id")
        .gte("created_at", today.toISOString());

      if (txError) {
        console.error('[LoyaltyStats] Transaction query error:', txError);
        throw txError;
      }

      const { data: topCustomers, error: custError } = await supabase
        .from("customers")
        .select("name, loyalty_points")
        .order("loyalty_points", { ascending: false })
        .limit(config.topNCustomers);

      if (custError) {
        console.error('[LoyaltyStats] Customer query error:', custError);
        throw custError;
      }

      const totalPoints = transactions?.reduce((sum, t) => sum + t.points_delta, 0) || 0;
      const uniqueCustomers = new Set(transactions?.map(t => t.customer_id)).size;

      console.log('[LoyaltyStats] Data fetched:', {
        transactions: transactions?.length,
        customers: topCustomers?.length,
        totalPoints,
        uniqueCustomers
      });

      return {
        totalPoints,
        uniqueCustomers,
        topCustomers: topCustomers || [],
      };
    },
    refetchInterval: config.refreshInterval * 1000,
    retry: 3,
    retryDelay: 1000,
  });

  // Register refetch function
  useEffect(() => {
    registerRefresh(refetch);
  }, [refetch, registerRefresh]);

  const getMedalIcon = useCallback((index: number) => {
    if (index === 0) return { emoji: "🥇", color: "text-yellow-500" };
    if (index === 1) return { emoji: "🥈", color: "text-gray-400" };
    if (index === 2) return { emoji: "🥉", color: "text-amber-600" };
    return { emoji: "🏅", color: "text-muted-foreground" };
  }, []);

  const CustomerCard = ({ customer, index }: { customer: any; index: number }) => {
    const medal = getMedalIcon(index);
    
    return (
      <div className={cn("flex items-center justify-between rounded-lg border bg-card/50", config.compactMode ? "px-2 py-1.5 h-10" : "px-3 py-2 h-12")}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className={cn("flex-shrink-0", config.compactMode ? "text-base" : "text-lg")}>{medal.emoji}</span>
          <p className={cn("font-semibold line-clamp-1", config.compactMode ? "text-[13px]" : "text-sm")}>{customer.name || "Unknown"}</p>
        </div>
        <p className={cn("font-bold text-primary flex-shrink-0 ml-2", config.compactMode ? "text-base" : "text-lg")}>{customer.loyalty_points.toLocaleString()}</p>
      </div>
    );
  };

  if (error) {
    return (
      <Card className={cn("glass-card flex flex-col w-full h-full", config.compactMode ? "p-3" : "p-4")}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-destructive opacity-50" />
            <p className="text-sm text-destructive font-semibold">Failed to load loyalty data</p>
            <p className="text-xs text-muted-foreground mt-2">{error.message}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
              <Gift className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("glass-card flex flex-col w-full h-full", config.compactMode ? "p-3" : "p-4")}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold">Loyalty Stats</h3>
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
                <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '160px' }}>
                  {stats.topCustomers.slice(0, config.compactMode ? 5 : 10).map((customer, index) => (
                    <CustomerCard key={index} customer={customer} index={index} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});
