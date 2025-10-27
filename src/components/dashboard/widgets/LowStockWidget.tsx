import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";

export function LowStockWidget() {
  const navigate = useNavigate();
  const { config } = useWidgetConfig('low-stock');

  const { data: lowStockItems, isLoading } = useQuery({
    queryKey: ["low-stock-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("current_qty")
        .limit(20);

      if (error) throw error;
      
      // Filter items where current_qty <= reorder_point
      return data?.filter(item => 
        Number(item.current_qty) <= Number(item.reorder_point)
      ).slice(0, 5);
    },
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

  const getStockLevel = (current: number, reorder: number) => {
    const percentage = (current / reorder) * 100;
    if (percentage <= 10) return { color: "text-destructive", bg: "bg-destructive/20", level: "Critical" };
    if (percentage <= 30) return { color: "text-warning", bg: "bg-warning/20", level: "Low" };
    return { color: "text-success", bg: "bg-success/20", level: "OK" };
  };

  return (
    <Card className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h3 className="font-semibold text-base">Low Stock Alert</h3>
        </div>
        {lowStockItems && lowStockItems.length > 0 && (
          <span className="text-xs font-semibold text-warning">
            {lowStockItems.length} items
          </span>
        )}
      </div>

      <div className={cn("flex-1 overflow-y-auto mb-3", config.displayType === 'table' ? "space-y-1" : "space-y-2")}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))
        ) : lowStockItems && lowStockItems.length > 0 ? (
          config.displayType === 'cards' ? (
            lowStockItems.map((item) => {
              const stockInfo = getStockLevel(Number(item.current_qty), Number(item.reorder_point));
              const percentage = Math.min(100, (Number(item.current_qty) / Number(item.reorder_point)) * 100);

              return (
                <div key={item.id} className="p-2 bg-accent/30 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.current_qty} {item.unit} left
                      </p>
                    </div>
                    <span className={cn("text-xs font-semibold ml-2", stockInfo.color)}>
                      {stockInfo.level}
                    </span>
                  </div>
                  <div className="relative h-2 bg-accent rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", stockInfo.bg)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-1">
              {lowStockItems.map((item) => {
                const stockInfo = getStockLevel(Number(item.current_qty), Number(item.reorder_point));
                return (
                  <div key={item.id} className="flex items-center justify-between p-1.5 bg-accent/30 rounded text-xs">
                    <span className="font-medium line-clamp-1 flex-1">{item.name}</span>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-muted-foreground">{item.current_qty} {item.unit}</span>
                      <Badge variant="outline" className={cn("text-[10px] h-4", stockInfo.color)}>
                        {stockInfo.level}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            All items in stock
          </div>
        )}
      </div>

      {lowStockItems && lowStockItems.length > 0 && (
        <Button
          onClick={() => navigate("/admin/inventory")}
          variant="outline"
          size="sm"
          className="w-full"
        >
          View Inventory
          <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      )}
    </Card>
  );
}
