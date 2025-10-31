import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChefHat, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface OrderCardProps {
  order: any;
  onBump?: () => void;
  onRecall?: () => void;
  showRecallButton?: boolean;
}

export function OrderCard({ order, onBump, onRecall, showRecallButton = false }: OrderCardProps) {
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

  return (
    <Card className={`${getStatusColor(order.status)} transition-all`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Order #{order.id.substring(0, 8)}</h3>
            <p className="text-sm text-muted-foreground">
              Table {order.table_id || 'Takeaway'}
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
