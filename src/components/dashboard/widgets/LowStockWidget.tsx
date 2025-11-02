import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ArrowRight, PackageX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { LowStockConfig } from "@/types/widgetConfigs";

export function LowStockWidget() {
  const navigate = useNavigate();
  const { config } = useWidgetConfig<LowStockConfig>('low-stock');
  const maxItems = config.maxItems || 3;

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
      ).slice(0, maxItems);
    },
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

  const getStockBadge = (current: number, reorder: number) => {
    const percentage = (current / reorder) * 100;
    if (percentage <= 10) return { label: "Critical", variant: "destructive" as const };
    if (percentage <= 30) return { label: "Low", variant: "outline" as const };
    return { label: "OK", variant: "secondary" as const };
  };

  return (
    <Card className="glass-card p-3 w-[240px] h-[240px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h3 className="font-semibold text-xs">Low Stock</h3>
        </div>
        {lowStockItems && lowStockItems.length > 0 && (
          <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30 h-5 text-[10px] px-1.5">
            {lowStockItems.length}
          </Badge>
        )}
      </div>

      <div className={cn(
        "flex-1 min-h-0",
        lowStockItems && lowStockItems.length > 0 
          ? "space-y-1.5 overflow-y-auto" 
          : "flex items-center justify-center"
      )}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))
        ) : lowStockItems && lowStockItems.length > 0 ? (
          lowStockItems.map((item) => {
            const stockBadge = getStockBadge(Number(item.current_qty), Number(item.reorder_point));

            return (
              <div 
                key={item.id} 
                className="p-2 rounded-md bg-accent/30 border border-border/50 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-warning/20 flex-shrink-0">
                    <PackageX className="h-3.5 w-3.5 text-warning" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-xs line-clamp-1">{item.name}</p>
                      <Badge 
                        variant={stockBadge.variant}
                        className="text-[9px] h-4 px-1 whitespace-nowrap"
                      >
                        {stockBadge.label}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {item.current_qty} {item.unit}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <PackageX className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-xs font-medium">All stocked</p>
          </div>
        )}
      </div>

      {lowStockItems && lowStockItems.length > 0 && (
        <Button
          onClick={() => navigate("/admin/inventory")}
          variant="outline"
          size="sm"
          className="w-full mt-2 h-7 text-xs"
        >
          View All
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      )}
    </Card>
  );
}
