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
        color: 'bg-success/10 border-success/30 text-success',
        pulse: false,
        icon: <CheckCircle className="h-5 w-5 text-success" />,
      };
    }

    const order = table.current_order;
    const hasNFC = !!order.nfc_card_id;
    
    if (order.status === 'delivered') {
      return {
        label: 'Ready to Pay',
        color: hasNFC 
          ? 'bg-primary/15 border-primary/40 text-primary ring-2 ring-primary/20' 
          : 'bg-primary/10 border-primary/30 text-primary',
        pulse: true,
        icon: <CreditCard className="h-5 w-5 text-primary" />,
      };
    }

    if (order.status === 'preparing') {
      return {
        label: 'Preparing',
        color: hasNFC
          ? 'bg-warning/15 border-warning/40 text-warning ring-2 ring-warning/20'
          : 'bg-warning/10 border-warning/30 text-warning',
        pulse: false,
        icon: <Clock className="h-5 w-5 text-warning" />,
      };
    }

    return {
      label: 'Occupied',
      color: hasNFC
        ? 'bg-warning/15 border-warning/40 text-warning ring-2 ring-warning/20'
        : 'bg-warning/10 border-warning/30 text-warning',
      pulse: false,
      icon: <Clock className="h-5 w-5 text-warning" />,
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
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-success/10 border border-success/30 dark:bg-success/15 dark:border-success/40">
                      <NfcIcon className="h-4 w-4 text-success" />
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
