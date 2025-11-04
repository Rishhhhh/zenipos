import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Clock, CheckCircle, CreditCard, Users, NfcIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TableCardProps {
  table: any;
  onClick: () => void;
}

export function TableCard({ table, onClick }: TableCardProps) {
  const getTableState = () => {
    if (!table.current_order) {
      return {
        label: 'Available',
        color: 'bg-green-500/10 border-green-500 text-green-700 dark:text-green-400',
        pulse: false,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      };
    }

    const order = table.current_order;
    const hasNFC = !!order.nfc_card_id;
    
    if (order.status === 'delivered') {
      return {
        label: 'Ready to Pay',
        color: hasNFC 
          ? 'bg-primary/20 border-primary text-primary ring-2 ring-primary/30' 
          : 'bg-primary/10 border-primary text-primary',
        pulse: true,
        icon: <CreditCard className="h-5 w-5 text-primary" />,
      };
    }

    if (order.status === 'preparing') {
      return {
        label: 'Preparing',
        color: hasNFC
          ? 'bg-orange-500/20 border-orange-500 text-orange-700 dark:text-orange-400 ring-2 ring-orange-500/30'
          : 'bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-400',
        pulse: false,
        icon: <Clock className="h-5 w-5 text-orange-500" />,
      };
    }

    return {
      label: 'Occupied',
      color: hasNFC
        ? 'bg-orange-500/20 border-orange-500 text-orange-700 dark:text-orange-400 ring-2 ring-orange-500/30'
        : 'bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-400',
      pulse: false,
      icon: <Clock className="h-5 w-5 text-orange-500" />,
    };
  };

  const state = getTableState();
  const order = table.current_order;

  return (
    <Card
      onClick={onClick}
      className={`
        relative cursor-pointer transition-all 
        hover:shadow-xl hover:-translate-y-1
        ${state.color}
        ${state.pulse ? 'animate-pulse' : ''}
        border-2 p-6 min-h-[140px]
      `}
    >
      <div className="flex flex-col gap-3">
        {/* Header with Icon */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {state.icon}
            <h3 className="text-3xl font-bold">{table.label}</h3>
            
            {/* Show NFC card icon if table has linked card */}
            {order?.nfc_card_id && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/20 border border-green-500/30">
                      <NfcIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
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
          <Badge variant="secondary" className={`${state.color} font-semibold`}>
            {state.label}
          </Badge>
        </div>

        {/* Seat Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{table.seats} seats</span>
        </div>

        {/* Order Info */}
        {order && (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </div>
            <div className="text-lg font-bold">
              RM {order.total.toFixed(2)}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
