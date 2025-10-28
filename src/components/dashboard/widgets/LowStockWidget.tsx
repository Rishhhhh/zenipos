import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ArrowRight, PackageX, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { LowStockConfig } from "@/types/widgetConfigs";
import { Progress } from "@/components/ui/progress";

export function LowStockWidget() {
  const navigate = useNavigate();
  const { config } = useWidgetConfig<LowStockConfig>('low-stock');

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
    <Card className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h3 className="font-semibold text-lg">Low Stock Alert</h3>
        </div>
        {lowStockItems && lowStockItems.length > 0 && (
          <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
            {lowStockItems.length} items
          </Badge>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto mb-3 space-y-2.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))
        ) : lowStockItems && lowStockItems.length > 0 ? (
          lowStockItems.map((item) => {
            const stockInfo = getStockLevel(Number(item.current_qty), Number(item.reorder_point));
            const percentage = Math.min(100, (Number(item.current_qty) / Number(item.reorder_point)) * 100);
            const isCritical = percentage <= 10;

            return (
              <div 
                key={item.id} 
                className={cn(
                  "p-3 rounded-lg border transition-all hover:shadow-md",
                  isCritical ? "bg-destructive/5 border-destructive/30" : "bg-accent/30 border-border/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0",
                    isCritical ? "bg-destructive/20" : "bg-warning/20"
                  )}>
                    {isCritical ? (
                      <PackageX className="h-5 w-5 text-destructive animate-pulse" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {item.current_qty} {item.unit} left (reorder at {item.reorder_point})
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs h-5 px-2 whitespace-nowrap",
                          stockInfo.color,
                          isCritical && "animate-pulse"
                        )}
                      >
                        {stockInfo.level}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Stock Level</span>
                        <span className={cn("font-semibold", stockInfo.color)}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className={cn("h-2", isCritical && "animate-pulse")}
                      />
                    </div>
                    
                    {config.autoReorder && isCritical && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-2 h-7 text-xs"
                        onClick={() => navigate("/admin/purchase-orders")}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Create PO
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <PackageX className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">All items in stock</p>
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
