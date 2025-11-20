import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChefHat, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: any;
  onBump?: () => void;
  onRecall?: () => void;
  onModify?: () => void;
  showRecallButton?: boolean;
  isMobile?: boolean;
}

export function OrderCard({ order, onBump, onRecall, onModify, showRecallButton = false, isMobile = false }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 border-warning';
      case 'preparing': return 'bg-blue-500/10 border-blue-500';
      case 'completed': return 'bg-success/10 border-success';
      default: return 'bg-muted';
    }
  };

  const itemsStarted = order.items?.some((item: any) => 
    item.kds_status === 'preparing' || item.kds_status === 'completed'
  );
  
  const getTimeElapsed = () => {
    const elapsed = Date.now() - new Date(order.created_at).getTime();
    const minutes = Math.floor(elapsed / 60000);
    return minutes;
  };

  const getTimerColor = (minutes: number) => {
    if (minutes < 5) return 'text-success';
    if (minutes < 10) return 'text-warning';
    return 'text-destructive';
  };

  const minutes = getTimeElapsed();

  // MOBILE COMPACT VIEW
  if (isMobile) {
    return (
      <Card className={cn(getStatusColor(order.status), "transition-all border-l-4")}>
        <CardContent className="p-3 space-y-2">
          {/* Compact Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">
                #{order.id.substring(0, 6)}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {order.tables?.label 
                  ? `T${order.tables.label}` 
                  : order.order_type === 'takeaway' 
                    ? 'Takeaway' 
                    : 'Counter'}
              </Badge>
            </div>
            <div className={cn("text-sm font-bold tabular-nums", getTimerColor(minutes))}>
              {minutes}m
            </div>
          </div>

          {/* Compact Items List */}
          <div className="space-y-1">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-semibold text-primary">{item.quantity}x</span>
                  <span className="font-medium truncate">{item.menu_item_name || item.menu_items?.name}</span>
                </div>
                {item.kds_status && (
                  <Badge variant="outline" className="ml-2 text-xs shrink-0">
                    {item.kds_status}
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Modifiers & Notes (collapsed) */}
          {order.items?.some((item: any) => item.notes || item.modifiers?.length > 0) && (
            <div className="text-xs text-muted-foreground">
              {order.items.map((item: any) => (
                <div key={item.id}>
                  {item.modifiers?.length > 0 && (
                    <span className="block">+ {item.modifiers.join(', ')}</span>
                  )}
                  {item.notes && (
                    <span className="block italic">Note: {item.notes}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recall Warning */}
          {order.recall_requested && (
            <div className="flex items-center gap-1 p-1.5 bg-warning/20 rounded text-warning">
              <AlertCircle className="h-3 w-3" />
              <span className="text-xs font-medium">Recall Requested</span>
            </div>
          )}

          {/* Compact Action Buttons */}
          <div className="flex gap-2 pt-1">
            {showRecallButton && !order.recall_requested && onRecall && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRecall}
                className="flex-1 h-11"
              >
                Recall
              </Button>
            )}
            {onModify && (
              <Button
                variant="outline"
                size="sm"
                onClick={onModify}
                className="flex-1 h-11"
              >
                Edit
              </Button>
            )}
            {onBump && (
              <Button
                onClick={onBump}
                variant={itemsStarted ? "default" : "secondary"}
                size="sm"
                className="flex-1 h-11 font-semibold"
              >
                <ChefHat className="h-4 w-4 mr-1" />
                Ready
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // TABLET/DESKTOP FULL VIEW
  return (
    <Card className={`${getStatusColor(order.status)} transition-all`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Order #{order.id.substring(0, 8)}</h3>
            <p className="text-sm text-muted-foreground">
              {order.tables?.label 
                ? `Table ${order.tables.label}` 
                : order.order_type === 'takeaway' 
                  ? 'Takeaway' 
                  : 'Counter'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={order.status === 'pending' ? 'default' : 'outline'}>
              {order.status}
            </Badge>
            {itemsStarted && (
              <Badge variant="outline" className="bg-blue-500/10">
                <ChefHat className="h-3 w-3 mr-1" />
                Started
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Order Items */}
        <div className="space-y-2">
          {order.items?.map((item: any) => (
            <div
              key={item.id}
              className="flex items-start justify-between p-2 rounded-lg bg-background/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.quantity}x</span>
                  <span className="font-medium">{item.menu_item_name}</span>
                  {item.modified && (
                    <Badge variant="outline" className="text-xs">
                      Modified
                    </Badge>
                  )}
                </div>
                {item.notes && (
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Note: {item.notes}
                  </p>
                )}
                {item.modifiers && item.modifiers.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    + {item.modifiers.join(', ')}
                  </p>
                )}
              </div>
              {item.kds_status && (
                <Badge variant="outline" className="ml-2">
                  {item.kds_status}
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Recall Warning */}
        {order.recall_requested && (
          <div className="flex items-center gap-2 p-2 bg-warning/20 rounded-lg text-warning">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Recall Requested - Awaiting Approval</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {showRecallButton && onRecall && !order.recall_requested && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRecall}
              className="flex-1"
            >
              Recall
            </Button>
          )}
          {onBump && order.status !== 'completed' && (
            <Button
              onClick={onBump}
              size="sm"
              className="flex-1"
            >
              Bump
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
