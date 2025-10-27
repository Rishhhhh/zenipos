import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { cn } from "@/lib/utils";

export function TopItemsWidget() {
  const { config } = useWidgetConfig('top-items');
  
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

      // Aggregate by menu item
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

      // Convert to array and sort by quantity
      return Array.from(itemMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  return (
    <Card className="glass-card p-4 min-h-[300px] min-w-[350px] flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Star className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-base">Top Selling Items</h3>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))
        ) : topItems && topItems.length > 0 ? (
          config.displayType === 'cards' ? (
            <div className={cn("grid gap-2", config.compactMode ? "grid-cols-1" : "grid-cols-1")}>
              {topItems.map((item, index) => (
                <div key={index} className={cn("bg-accent/30 rounded-lg", config.compactMode ? "p-2" : "p-2")}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("font-medium line-clamp-1 flex-1", config.compactMode ? "text-xs" : "text-sm")}>
                      {index + 1}. {item.name}
                    </span>
                    <span className="text-xs font-semibold text-primary ml-2">
                      RM {item.revenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${(item.quantity / (topItems[0]?.quantity || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.quantity} sold
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {topItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-1.5 bg-accent/30 rounded text-xs">
                  <span className="font-medium line-clamp-1 flex-1">
                    {index + 1}. {item.name}
                  </span>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant="outline" className="text-[10px] h-4">{item.quantity}</Badge>
                    <span className="font-semibold text-primary whitespace-nowrap">
                      RM {item.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No sales data yet
          </div>
        )}
      </div>
    </Card>
  );
}
