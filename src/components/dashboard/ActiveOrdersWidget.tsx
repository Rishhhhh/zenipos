import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ChefHat, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { cn } from "@/lib/utils";

export function ActiveOrdersWidget() {
  const navigate = useNavigate();
  const { config } = useWidgetConfig('active-orders');

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
        return "bg-warning/20 text-warning";
      case "preparing":
        return "bg-primary/20 text-primary";
      default:
        return "bg-accent text-foreground";
    }
  };

  return (
    <Card className="glass-card p-5 h-full flex flex-col">
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
      <div className={cn("flex-1 overflow-y-auto mb-4", config.displayType === 'table' ? "space-y-1" : "space-y-2")}>
        {!orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <ChefHat className="h-8 w-8 mb-2 opacity-50" />
            <p>No active orders</p>
          </div>
        ) : config.displayType === 'cards' ? (
          orders.map((order) => (
            <div
              key={order.id}
              className={cn(
                "bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer",
                config.compactMode ? "p-2" : "p-3"
              )}
              onClick={() => navigate("/kds")}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn("font-mono font-semibold", config.compactMode ? "text-xs" : "text-sm")}>
                    #{order.id.slice(0, 8)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(getStatusColor(order.status), config.compactMode && "text-xs h-4")}
                  >
                    {order.status}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {order.table_id ? `Table ${order.table_id}` : order.order_type}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(order.created_at), {
                    addSuffix: true,
                  })}
                </div>
                <span className={cn("font-semibold text-primary", config.compactMode ? "text-xs" : "text-sm")}>
                  RM {order.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-1">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-2 bg-accent/30 rounded hover:bg-accent/50 transition-colors cursor-pointer text-xs"
                onClick={() => navigate("/kds")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">#{order.id.slice(0, 8)}</span>
                    <Badge variant="outline" className={cn(getStatusColor(order.status), "text-[10px] h-4")}>
                      {order.status}
                    </Badge>
                  </div>
                  <span className="font-semibold text-primary">RM {order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
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
