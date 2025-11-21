import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Clock, CheckCircle, CreditCard, Users, NfcIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { cn } from '@/lib/utils';

interface TableCardProps {
  table: any;
  onClick: () => void;
}

export function TableCard({ table, onClick }: TableCardProps) {
  const { isMobile, isTablet } = useDeviceDetection();
  const isTouch = isMobile || isTablet;

  const getTableState = () => {
    if (!table.current_order) {
      return {
        label: 'Available',
        // Soft mint green (muted, professional)
        color: 'bg-emerald-50/50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-700',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
        pulse: false,
        icon: <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      };
    }

    const order = table.current_order;
    const hasNFC = !!order.nfc_card_id;
    
    if (order.status === 'delivered') {
      return {
        label: 'Ready to Pay',
        // RED (destructive/alert color for ready to pay)
        color: hasNFC 
          ? 'bg-red-100/60 border-red-400 dark:bg-red-950/30 dark:border-red-600 ring-2 ring-red-300 dark:ring-red-700/50' 
          : 'bg-red-50/50 border-red-300 dark:bg-red-950/20 dark:border-red-700',
        textColor: 'text-red-700 dark:text-red-400',
        badgeColor: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
        pulse: true,
        icon: <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />,
      };
    }

    if (order.status === 'preparing') {
      return {
        label: 'Preparing',
        // Soft amber/orange (muted, warm)
        color: hasNFC
          ? 'bg-amber-100/60 border-amber-400 dark:bg-amber-950/30 dark:border-amber-600 ring-2 ring-amber-300 dark:ring-amber-700/50'
          : 'bg-amber-50/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700',
        textColor: 'text-amber-700 dark:text-amber-400',
        badgeColor: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
        pulse: false,
        icon: <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      };
    }

    return {
      label: 'Occupied',
      // Soft amber for occupied (same as preparing)
      color: hasNFC
        ? 'bg-amber-100/60 border-amber-400 dark:bg-amber-950/30 dark:border-amber-600 ring-2 ring-amber-300 dark:ring-amber-700/50'
        : 'bg-amber-50/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700',
      textColor: 'text-amber-700 dark:text-amber-400',
      badgeColor: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
      pulse: false,
      icon: <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
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
        {/* Header - Fixed height section */}
        <div className="flex items-start justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            {state.icon}
            <h3 className={cn("font-bold", isTouch ? "text-2xl" : "text-3xl")}>
              {table.label}
            </h3>
            
            {/* NFC Card Badge */}
            {order?.nfc_card_id && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100/60 border border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700">
                      <NfcIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs font-mono">
                      Card: {order.nfc_cards?.[0]?.card_uid || order.nfc_card_id.slice(0, 8)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <Badge className={cn("font-semibold text-xs", state.badgeColor)}>
            {state.label}
          </Badge>
        </div>

        {/* Content - Flex-grow to fill remaining space */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Seat Count - Always visible */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span>{table.seats} seats</span>
          </div>

          {/* Order Info - Fixed position at bottom */}
          {order ? (
            <div className="space-y-1.5">
              <div className={cn("flex items-center gap-2 text-muted-foreground", isTouch ? "text-xs" : "text-sm")}>
                <Clock className="h-3.5 w-3.5" />
                <span className="truncate">
                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className={cn("font-bold", state.textColor, isTouch ? "text-base" : "text-lg")}>
                RM {order.total.toFixed(2)}
              </div>
            </div>
          ) : (
            // Empty placeholder to maintain height consistency
            <div className="h-[52px]" />
          )}
        </div>
      </div>
    </Card>
  );
}
