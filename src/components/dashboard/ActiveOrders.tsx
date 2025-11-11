import { memo, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ChefHat, ArrowRight, Hash, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRealtimeTable } from "@/lib/realtime/RealtimeService";
import { Button } from "@/components/ui/button";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { ActiveOrdersConfig } from "@/types/widgetConfigs";
import { cn } from "@/lib/utils";
import { VariableSizeList } from 'react-window';

interface OrderRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    orders: any[];
    getStatusColor: (status: string) => any;
    getTimerColor: (createdAt: string) => string;
    compactMode: boolean;
    config: ActiveOrdersConfig;
    navigate: (path: string) => void;
  };
}

export default memo(function ActiveOrders() {
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
        .limit(15);

      if (error) throw error;
      return data;
    },
  });

  useRealtimeTable('orders', () => refetch());

  const getStatusColor = useCallback((status: string) => {
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
  }, []);
  
  const getTimerColor = useCallback((createdAt: string) => {
    const minutes = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
    if (minutes > config.alertThresholdMinutes) return "text-destructive";
    if (minutes > config.alertThresholdMinutes * 0.7) return "text-warning";
    return "text-success";
  }, [config.alertThresholdMinutes]);

  const getOrdersByStatus = useMemo(() => (status: string) => {
    if (!orders) return [];
    return orders
      .filter(order => order.status === status && config.statusFilters.includes(order.status as any))
      .sort((a, b) => {
        switch (config.sortBy) {
          case 'orderTime':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'tableNumber':
            const tableA = typeof a.table_id === 'number' ? a.table_id : parseInt(String(a.table_id || '0'));
            const tableB = typeof b.table_id === 'number' ? b.table_id : parseInt(String(b.table_id || '0'));
            return tableA - tableB;
          case 'priority':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          default:
          return 0;
        }
      });
  }, [orders, config.statusFilters, config.sortBy]);

  const getFilteredOrders = useMemo(() => () => {
    if (!orders) return [];
    return orders
      .filter(order => config.statusFilters.includes(order.status as any))
      .sort((a, b) => {
        switch (config.sortBy) {
          case 'orderTime':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'tableNumber':
            const tableA = typeof a.table_id === 'number' ? a.table_id : parseInt(String(a.table_id || '0'));
            const tableB = typeof b.table_id === 'number' ? b.table_id : parseInt(String(b.table_id || '0'));
            return tableA - tableB;
          case 'priority':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          default:
          return 0;
        }
      });
  }, [orders, config.statusFilters, config.sortBy]);

  const filteredOrders = useMemo(() => getFilteredOrders(), [getFilteredOrders]);

  const handleNavigateToKDS = useCallback(() => {
    navigate("/kds");
  }, [navigate]);

  const getItemHeight = useCallback((index: number) => {
    return config.compactMode ? 66 : 88;
  }, [config.compactMode]);

  const OrderRow = memo(({ index, style, data }: OrderRowProps) => {
    const order = data.orders[index];
    const statusColors = data.getStatusColor(order.status);
    const timerColor = data.getTimerColor(order.created_at);
    const minutes = Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60));
    
    return (
      <div style={{ ...style, paddingBottom: data.compactMode ? '6px' : '8px' }}>
        {data.compactMode ? (
          <div
            className={cn(
              "p-2 rounded-lg border transition-all hover:shadow-md cursor-pointer",
              statusColors.bg,
              statusColors.border
            )}
            onClick={() => data.navigate("/kds")}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <ChefHat className={cn("h-4 w-4 flex-shrink-0", statusColors.text)} />
                <span className="font-mono font-semibold text-xs truncate">
                  #{order.id.slice(0, 8)}
                </span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    statusColors.bg,
                    statusColors.text,
                    statusColors.border,
                    "text-[10px] h-4 px-1"
                  )}
                >
                  {order.status}
                </Badge>
              </div>
              <span className="text-sm font-bold text-primary flex-shrink-0">
                RM {order.total.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground pl-6">
              {order.table_id && <span>Table {order.table_id}</span>}
              <span>•</span>
              <span>{Array.isArray(order.order_items) ? order.order_items.length : 0} items</span>
              {data.config.showTimer && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className={cn("h-3 w-3", timerColor)} />
                    <span className={cn("font-semibold", timerColor)}>
                      {minutes < 1 ? "Just now" : `${minutes} min`}
                    </span>
                    {minutes > data.config.alertThresholdMinutes && (
                      <span className="text-destructive font-semibold ml-1 animate-pulse">⚠️ OVERDUE</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
              statusColors.bg,
              statusColors.border
            )}
            onClick={() => data.navigate("/kds")}
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
                
                {data.config.showTimer && (
                  <div className="flex items-center gap-1.5">
                    <Clock className={cn("h-3.5 w-3.5", timerColor)} />
                    <span className={cn("text-xs font-semibold", timerColor)}>
                      {minutes < 1 ? "Just now" : `${minutes} min${minutes > 1 ? 's' : ''} ago`}
                    </span>
                    {minutes > data.config.alertThresholdMinutes && (
                      <Badge variant="outline" className="ml-auto bg-destructive/20 text-destructive text-xs border-destructive/30 animate-pulse">
                        Overdue
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  });

  const OrderCard = ({ order, compact = false }: { order: any; compact?: boolean }) => {
    const statusColors = getStatusColor(order.status);
    const timerColor = getTimerColor(order.created_at);
    const minutes = Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60));
    
    return (
      <div
        className={cn(
          "rounded-lg border transition-all hover:shadow-md cursor-pointer",
          statusColors.bg,
          statusColors.border,
          compact ? "p-2" : "p-3"
        )}
        onClick={() => navigate("/kds")}
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("font-mono font-semibold", compact ? "text-xs" : "text-sm")}>
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
          
          <div className={cn("font-bold text-primary", compact ? "text-sm" : "text-base")}>
            RM {order.total.toFixed(2)}
          </div>
          
          {!compact && order.table_id && (
            <div className="flex items-center gap-1.5">
              <Hash className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Table {order.table_id}</span>
            </div>
          )}
          
          {compact && order.table_id && (
            <div className="text-xs text-muted-foreground">
              Table {order.table_id}
            </div>
          )}
          
          <div className="flex items-center gap-1.5">
            <Package className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {Array.isArray(order.order_items) ? order.order_items.length : 0} items
            </span>
          </div>
          
          {config.showTimer && (
            <div className="flex items-center gap-1.5">
              <Clock className={cn("h-3 w-3", timerColor)} />
              <span className={cn("text-xs font-semibold", timerColor)}>
                {minutes < 1 ? "Just now" : `${minutes} min`}
              </span>
              {minutes > config.alertThresholdMinutes && (
                <Badge variant="outline" className="ml-auto bg-destructive/20 text-destructive text-[10px] border-destructive/30 animate-pulse px-1 py-0 h-4">
                  ⚠️
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("glass-card w-full h-full flex flex-col", config.compactMode ? "p-3" : "p-4")}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Active Orders</h3>
        {filteredOrders && filteredOrders.length > 0 && (
          <Badge variant="default" className="bg-warning/20 text-warning">
            {filteredOrders.length}
          </Badge>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto mb-3">
        {!filteredOrders || filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <ChefHat className="h-8 w-8 mb-1 opacity-50" />
            <p className="text-xs">No active orders</p>
          </div>
        ) : config.viewMode === 'kanban' ? (
          <div className="flex gap-3 h-full">
            {(['pending', 'preparing'] as const).map(status => {
              const statusOrders = getOrdersByStatus(status);
              const statusColors = getStatusColor(status);
              
              return (
                <div key={status} className="flex-1 min-w-0">
                  <div className={cn(
                    "text-xs font-semibold uppercase mb-2 px-2 py-1 rounded flex items-center justify-between",
                    statusColors.bg, statusColors.text
                  )}>
                    <span>{status}</span>
                    <Badge variant="outline" className={cn("ml-1 h-4 text-[10px]", statusColors.bg, statusColors.text)}>
                      {statusOrders.length}
                    </Badge>
                  </div>
                  <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100% - 32px)' }}>
                    {statusOrders.map(order => (
                      <OrderCard 
                        key={order.id}
                        order={order} 
                        compact={config.compactMode}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <VariableSizeList
            height={500}
            itemCount={filteredOrders.length}
            itemSize={getItemHeight}
            width="100%"
            itemData={{
              orders: filteredOrders,
              getStatusColor,
              getTimerColor,
              compactMode: config.compactMode,
              config,
              navigate
            }}
          >
            {OrderRow}
          </VariableSizeList>
        )}
      </div>

      <Button
        onClick={handleNavigateToKDS}
        className="w-full"
        variant="outline"
      >
        Open Kitchen Display
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Card>
  );
});
