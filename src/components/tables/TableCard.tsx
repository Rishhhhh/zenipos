import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, CreditCard, Users, NfcIcon, MoreVertical, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { cn } from '@/lib/utils';

interface TableCardProps {
  table: any;
  onClick: () => void;
  onConfigureTable?: (tableId: string) => void;
}

export function TableCard({ table, onClick, onConfigureTable }: TableCardProps) {
  const { isMobile, isTablet } = useDeviceDetection();
  const isTouch = isMobile || isTablet;

  const getTableState = () => {
    // Check if table is reserved (before checking current_order)
    if (table.reservation_time && !table.current_order) {
      const reservationTime = new Date(table.reservation_time);
      const now = new Date();
      const timeDiff = reservationTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      // If reservation is within window (-15 min to +30 min)
      if (minutesDiff >= -15 && minutesDiff <= 30) {
        return {
          label: 'Reserved',
          color: 'bg-blue-50/50 border-blue-300 dark:bg-blue-950/20 dark:border-blue-700',
          textColor: 'text-blue-700 dark:text-blue-400',
          badgeColor: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
          pulse: false,
          icon: <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
        };
      }
    }
    
    if (!table.current_order) {
      return {
        label: 'Available',
        color: 'bg-emerald-50/50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-700',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
        pulse: false,
        icon: <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
      };
    }

    const order = table.current_order;
    const hasNFC = !!order.nfc_card_id;
    
    if (order.status === 'delivered') {
      return {
        label: 'Ready to Pay',
        color: hasNFC 
          ? 'bg-red-100/60 border-red-400 dark:bg-red-950/30 dark:border-red-600 ring-2 ring-red-300 dark:ring-red-700/50' 
          : 'bg-red-50/50 border-red-300 dark:bg-red-950/20 dark:border-red-700',
        textColor: 'text-red-700 dark:text-red-400',
        badgeColor: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
        pulse: true,
        icon: <CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" />,
      };
    }

    if (order.status === 'preparing') {
      return {
        label: 'Preparing',
        color: hasNFC
          ? 'bg-amber-100/60 border-amber-400 dark:bg-amber-950/30 dark:border-amber-600 ring-2 ring-amber-300 dark:ring-amber-700/50'
          : 'bg-amber-50/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700',
        textColor: 'text-amber-700 dark:text-amber-400',
        badgeColor: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
        pulse: false,
        icon: <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
      };
    }

    return {
      label: 'Occupied',
      color: hasNFC
        ? 'bg-amber-100/60 border-amber-400 dark:bg-amber-950/30 dark:border-amber-600 ring-2 ring-amber-300 dark:ring-amber-700/50'
        : 'bg-amber-50/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700',
      textColor: 'text-amber-700 dark:text-amber-400',
      badgeColor: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
      pulse: false,
      icon: <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
    };
  };

  const state = getTableState();
  const order = table.current_order;
  const allOrders = table.current_orders || [];
  
  // Calculate combined total from ALL orders for this table
  const combinedTotal = allOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const orderCount = allOrders.length;

  return (
    <Card
      onClick={onClick}
      className={cn(
        'table-card relative cursor-pointer transition-all',
        'hover:shadow-xl hover:-translate-y-1',
        'border-2',
        state.color,
        state.pulse && 'animate-pulse',
        // Fixed height structure
        'flex flex-col',
        // Responsive heights
        isTouch ? 'h-[160px]' : 'h-[140px]',
        // Responsive padding
        isTouch ? 'p-4' : 'p-5'
      )}
    >
      {/* 4-QUADRANT LAYOUT */}
      <div className="flex flex-col h-full justify-between">
        {/* TOP ROW */}
        <div className="flex items-start justify-between">
          {/* Top-left: Table name */}
          <div className="space-y-0.5">
            <h3 className={cn("font-bold truncate", isTouch ? "text-2xl" : "text-3xl", state.textColor)}>
              {table.custom_name || table.label}
            </h3>
            {table.custom_name && (
              <div className="text-xs text-muted-foreground">
                ({table.label})
              </div>
            )}
          </div>
          
          {/* Top-right: Badge + 3-dot Menu */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge className={cn("font-semibold text-xs whitespace-nowrap", state.badgeColor)}>
              {state.label}
            </Badge>
            
            {onConfigureTable && (
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigureTable(table.id);
                }}
                className="h-7 w-7"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex items-end justify-between">
          {/* Bottom-left: Card + Time */}
          <div className="space-y-0.5">
            {order?.nfc_card_id && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <NfcIcon className="h-3 w-3" />
                <span className="font-mono truncate max-w-[100px]">
                  {order.nfc_cards?.[0]?.card_uid?.slice(0, 8) || order.nfc_card_id.slice(0, 8)}
                </span>
              </div>
            )}
            {order && (
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </div>
            )}
            {!order && table.reservation_time && state.label === 'Reserved' && (
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {table.reservation_name}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn("text-xs font-medium", state.textColor)}>
                        {(() => {
                          const reservationTime = new Date(table.reservation_time);
                          const now = new Date();
                          const minutesDiff = Math.round((reservationTime.getTime() - now.getTime()) / (1000 * 60));
                          
                          if (minutesDiff > 0) {
                            return `In ${minutesDiff} min`;
                          } else if (minutesDiff >= -15) {
                            return 'Arriving now';
                          } else {
                            return reservationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          }
                        })()}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {new Date(table.reservation_time).toLocaleString()}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          {/* Bottom-right: Total */}
          {order && (
            <div className="text-right">
              <div className={cn("font-bold", isTouch ? "text-xl" : "text-2xl", state.textColor)}>
                RM {combinedTotal.toFixed(2)}
              </div>
              {orderCount > 1 && (
                <div className="text-xs text-muted-foreground">
                  {orderCount} orders
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
