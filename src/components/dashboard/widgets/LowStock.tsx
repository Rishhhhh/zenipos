import { memo, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, PackageX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { LowStockConfig } from "@/types/widgetConfigs";
import { useRealtimeTable } from "@/lib/realtime/RealtimeService";
import { useWidgetRefresh } from "@/contexts/WidgetRefreshContext";

export default memo(function LowStock() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { config } = useWidgetConfig<LowStockConfig>('low-stock');
  const { registerRefresh } = useWidgetRefresh();
  
  // Real-time subscription for inventory changes
  useRealtimeTable('inventory_items', () => {
    queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
  });

  const { data: lowStockItems, isLoading, refetch } = useQuery({
    queryKey: ["low-stock-items", config.maxItems],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("current_qty")
        .limit(20);

      if (error) throw error;
      
      return data?.filter(item => 
        Number(item.current_qty) <= Number(item.reorder_point)
      ).slice(0, config.maxItems);
    },
    refetchInterval: config.refreshInterval * 1000,
  });

  // Register refetch function
  useEffect(() => {
    registerRefresh(refetch);
  }, [refetch, registerRefresh]);

  const getStockStatus = useCallback((current: number, reorder: number) => {
    const percentage = (current / reorder) * 100;
    if (percentage <= config.alertThreshold.critical) {
      return { color: "text-destructive", bg: "bg-destructive/10", label: "Critical", animate: true };
    }
    return { color: "text-warning", bg: "bg-warning/10", label: "Low", animate: false };
  }, [config.alertThreshold.critical]);

  const handleNavigateToInventory = useCallback(() => {
    navigate("/admin/inventory");
  }, [navigate]);

  return (
    <Card className={cn("glass-card flex flex-col w-full h-full", config.compactMode ? "p-3" : "p-4")}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Low Stock</h3>
        {lowStockItems && lowStockItems.length > 0 && (
          <Badge variant="destructive" className="text-xs">{lowStockItems.length} Items</Badge>
        )}
      </div>

      <div className={cn("flex-1 min-h-0", lowStockItems && lowStockItems.length > 0 ? "space-y-1.5 overflow-y-auto" : "flex items-center justify-center")}>
        {isLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn("rounded-md animate-shimmer border border-border/30", config.compactMode ? "h-[36px]" : "h-[40px]")} />
            ))}
          </div>
        ) : lowStockItems && lowStockItems.length > 0 ? (
          <div className="space-y-1.5 animate-fade-in-content">
          {lowStockItems.map((item) => {
            const status = getStockStatus(Number(item.current_qty), Number(item.reorder_point));
            return (
              <button key={item.id} onClick={handleNavigateToInventory} className={cn("w-full rounded-md border transition-all hover:shadow-sm active:scale-[0.98]", config.compactMode ? "p-1.5" : "p-2", status.bg, status.animate ? "border-destructive/30" : "border-border/30")}>
                <div className="flex items-center gap-2">
                  <div className={cn("flex items-center justify-center rounded-full flex-shrink-0", config.compactMode ? "w-6 h-6" : "w-7 h-7", status.animate ? "bg-destructive/20" : "bg-warning/20")}>
                    {status.animate ? <PackageX className={cn("text-destructive animate-pulse", config.compactMode ? "h-3 w-3" : "h-3.5 w-3.5")} /> : <AlertTriangle className={cn("text-warning", config.compactMode ? "h-3 w-3" : "h-3.5 w-3.5")} />}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className={cn("font-medium line-clamp-1", config.compactMode ? "text-[11px]" : "text-xs")}>{item.name}</p>
                    <p className={cn("text-muted-foreground", config.compactMode ? "text-[9px]" : "text-[10px]")}>{item.current_qty} {item.unit}</p>
                  </div>
                  <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", status.animate ? "bg-destructive animate-pulse" : "bg-warning")} />
                </div>
              </button>
            );
          })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <PackageX className={cn("mb-1 opacity-40", config.compactMode ? "h-8 w-8" : "h-10 w-10")} />
            <p className={cn("font-medium", config.compactMode ? "text-[10px]" : "text-xs")}>All in stock</p>
          </div>
        )}
      </div>
    </Card>
  );
});
