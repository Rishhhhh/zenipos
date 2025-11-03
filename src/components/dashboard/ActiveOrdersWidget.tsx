import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ChefHat, ArrowRight, Hash, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { ActiveOrdersConfig } from "@/types/widgetConfigs";
import { cn } from "@/lib/utils";

export function ActiveOrdersWidget() {
  const navigate = useNavigate();
  const { config } = useWidgetConfig<ActiveOrdersConfig>('active-orders');

  const { data: orders, refetch } = useQuery({
    queryKey: ["active-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(count)")
        .in("status", ["pending", "preparing"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("active-orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return { bg: "bg-warning/20", text: "text-warning", border: "border-warning/30" };
      case "preparing":
        return { bg: "bg-primary/20", text: "text-primary", border: "border-primary/30" };
      case "ready":
        return { bg: "bg-success/20", text: "text-success", border: "border-success/30" };
      default:
        return { bg: "bg-accent", text: "text-foreground", border: "border-border" };
    }
  };
  
  const getTimerColor = (createdAt: string) => {
    const minutes = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
    if (minutes > config.alertThresholdMinutes) return "text-destructive";
    if (minutes > config.alertThresholdMinutes * 0.7) return "text-warning";
    return "text-success";
  };

  return (
    <Card className={cn("glass-card p-5 h-full flex flex-col", config.compactMode && "p-3")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Active Orders</h3>
        </div>
        {orders && orders.length > 0 && (
          <Badge variant="default" className="bg-warning/20 text-warning">
            {orders.length}
          </Badge>
        )}
      </div>

      {/* Orders List */}
      <div className="flex-1 min-h-0 overflow-y-auto mb-4 space-y-2.5">
        {!orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ChefHat className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No active orders</p>
          </div>
        ) : (
          orders.map((order) => {
            const statusColors = getStatusColor(order.status);
            const timerColor = getTimerColor(order.created_at);
            const minutes = Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60));
            
            return (
              <div
                key={order.id}
                className={cn(
                  "p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                  statusColors.bg,
                  statusColors.border
                )}
                onClick={() => navigate("/kds")}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0",
                    statusColors.bg
                  )}>
                    <ChefHat className={cn("h-5 w-5", statusColors.text)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm">
                          #{order.id.slice(0, 8)}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            statusColors.bg,
                            statusColors.text,
                            statusColors.border,
                            "text-xs h-5"
                          )}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        RM {order.total.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      {order.table_id && (
                        <div className="flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Table {order.table_id}</span>
                        </div>
                      )}
                      {order.order_items && (
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {Array.isArray(order.order_items) ? order.order_items.length : 0} items
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {config.showTimer && (
                      <div className="flex items-center gap-1.5">
                        <Clock className={cn("h-3.5 w-3.5", timerColor)} />
                        <span className={cn("text-xs font-semibold", timerColor)}>
                          {minutes < 1 ? "Just now" : `${minutes} min${minutes > 1 ? 's' : ''} ago`}
                        </span>
                        {minutes > config.alertThresholdMinutes && (
                          <Badge variant="outline" className="ml-auto bg-destructive/20 text-destructive text-xs border-destructive/30 animate-pulse">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Go to KDS Button */}
      <Button
        onClick={() => navigate("/kds")}
        className="w-full"
        variant="outline"
      >
        Open Kitchen Display
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Card>
  );
}
