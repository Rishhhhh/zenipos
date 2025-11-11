import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trophy, Crown, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { TopItemsConfig } from "@/types/widgetConfigs";
import { cn } from "@/lib/utils";

export default function TopItems() {
  const { config } = useWidgetConfig<TopItemsConfig>('top-items');
  
  const { data: topItems, isLoading } = useQuery({
    queryKey: ["top-selling-items"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("order_items")
        .select(`
          quantity,
          unit_price,
          menu_item_id,
          menu_items (name),
          order_id,
          orders!inner (created_at, status)
        `)
        .gte("orders.created_at", today.toISOString())
        .eq("orders.status", "done");

      if (error) throw error;

      const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();

      data?.forEach((item: any) => {
        const existing = itemMap.get(item.menu_item_id) || {
          name: item.menu_items?.name || "Unknown",
          quantity: 0,
          revenue: 0,
        };

        itemMap.set(item.menu_item_id, {
          name: existing.name,
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.quantity * Number(item.unit_price)),
        });
      });

      return Array.from(itemMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-4 w-4 text-yellow-500 fill-yellow-500" />;
    if (index === 1) return <Trophy className="h-4 w-4 text-gray-400 fill-gray-400" />;
    if (index === 2) return <Trophy className="h-4 w-4 text-amber-600 fill-amber-600" />;
    return <Star className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <Card className={cn(
      "glass-card flex flex-col w-full h-full",
      config.compactMode ? "p-3" : "p-4"
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Top Items</h3>
        <Badge variant="outline" className="text-xs">
          Top {config.topN}
        </Badge>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))
        ) : topItems && topItems.length > 0 ? (
          topItems.slice(0, 4).map((item, index) => (
            <div 
              key={index} 
              className={cn(
                "bg-gradient-to-r rounded-lg border transition-all hover:shadow-md h-[48px]",
                config.compactMode ? "p-2" : "p-2.5",
                  index === 0 ? "from-yellow-500/10 to-transparent border-yellow-500/30" :
                  index === 1 ? "from-gray-400/10 to-transparent border-gray-400/30" :
                  index === 2 ? "from-amber-600/10 to-transparent border-amber-600/30" :
                  "from-accent/30 to-transparent border-border/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex items-center justify-center rounded-full bg-background/80 border border-border/50 flex-shrink-0",
                    config.compactMode ? "w-7 h-7" : "w-8 h-8"
                  )}>
                    {getRankIcon(index)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "flex items-start justify-between gap-2",
                      config.compactMode ? "mb-1" : "mb-2"
                    )}>
                      <h4 className="font-semibold text-sm line-clamp-1">
                        {item.name}
                      </h4>
                      {!config.compactMode && (
                        <span className="text-sm font-bold text-primary whitespace-nowrap">
                          RM {item.revenue.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex-1 bg-accent rounded-full overflow-hidden",
                        config.compactMode ? "h-1.5" : "h-2"
                      )}>
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            index === 0 ? "bg-yellow-500" :
                            index === 1 ? "bg-gray-400" :
                            index === 2 ? "bg-amber-600" :
                            "bg-primary"
                          )}
                          style={{
                            width: `${(item.quantity / (topItems[0]?.quantity || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs px-2",
                            config.compactMode ? "h-4" : "h-5"
                          )}
                        >
                          {item.quantity}
                        </Badge>
                        {config.showPercentages && topItems[0] && (
                          <span className="text-xs text-muted-foreground">
                            {((item.quantity / topItems[0].quantity) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No sales data yet</p>
          </div>
        )}
      </div>
    </Card>
  );
}
