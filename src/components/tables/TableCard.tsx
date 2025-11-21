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
      <div className="flex flex-col h-full">
        {/* Header Row: Icon + Name + Badge + 3-dot Menu */}
        <div className="flex items-start justify-between mb-2 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {state.icon}
            <h3 className={cn("font-bold truncate", isTouch ? "text-lg" : "text-xl")}>
              {table.label}
            </h3>
          </div>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Status Badge */}
            <Badge className={cn("font-semibold text-xs whitespace-nowrap", state.badgeColor)}>
              {state.label}
            </Badge>
            
            {/* 3-dot Settings Menu */}
            {onConfigureTable && (
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigureTable(table.id);
                }}
                className="h-7 w-7 flex-shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* NFC Card Badge (if exists) */}
        {order?.nfc_card_id && (
          <div className="mb-2 flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/60 border border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700">
                    <NfcIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-mono">{order.nfc_cards?.[0]?.card_uid?.slice(0, 8) || order.nfc_card_id.slice(0, 8)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-mono">
                    Card: {order.nfc_cards?.[0]?.card_uid || order.nfc_card_id.slice(0, 8)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Content - Flex-grow to fill remaining space */}
        <div className="flex-1 flex flex-col justify-between min-h-0">
          {/* Seat Count */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2 flex-shrink-0">
            <Users className="h-3.5 w-3.5" />
            <span>{table.seats} seats</span>
          </div>

          {/* Order Info or Reservation Info */}
          {order ? (
            <div className="space-y-1 flex-shrink-0">
              <div className={cn("flex items-center gap-1.5 text-muted-foreground", isTouch ? "text-xs" : "text-sm")}>
                <Clock className="h-3 w-3" />
                <span className="truncate">
                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className={cn("font-bold", state.textColor, isTouch ? "text-base" : "text-lg")}>
                RM {order.total.toFixed(2)}
              </div>
            </div>
          ) : table.reservation_time && state.label === 'Reserved' ? (
            <div className="space-y-1 flex-shrink-0">
              <div className="text-xs text-muted-foreground truncate">
                {table.reservation_name}
              </div>
              <div className={cn("text-sm font-medium", state.textColor)}>
                {new Date(table.reservation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
