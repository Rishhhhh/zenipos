import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TimelineItem } from './TimelineItem';
import { ShoppingCart, ChefHat, Truck, DollarSign, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface TableOrderDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: any;
  onPayment: () => void;
}

export function TableOrderDetails({ open, onOpenChange, table, onPayment }: TableOrderDetailsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBumping, setIsBumping] = useState(false);
  const [isOverriding, setIsOverriding] = useState(false);
  
  if (!table?.current_order) return null;

  const order = table.current_order;

  const handleManualBump = async () => {
    setIsBumping(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      await supabase
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          delivered_by: employee?.id,
        })
        .eq('id', order.id);

      toast({
        title: 'Order Delivered',
        description: 'Order marked as delivered. Ready for payment.',
      });

      queryClient.invalidateQueries({ queryKey: ['tables'] });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to mark as delivered',
        description: error.message,
      });
    } finally {
      setIsBumping(false);
    }
  };

  const handleAdminOverride = async () => {
    setIsOverriding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user is owner/manager (admin check)
      const { data: employee } = await supabase
        .from('employees')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (!employee || !['owner', 'manager'].includes(employee.role)) {
        throw new Error('Admin privileges required');
      }

      // Force order from 'preparing' directly to 'dining'
      await supabase
        .from('orders')
        .update({
          status: 'dining',
          dining_at: new Date().toISOString(),
          ready_at: new Date().toISOString(),
          serving_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // Log admin override action
      await supabase.from('audit_log').insert({
        actor: user.id,
        action: 'admin_override_to_dining',
        entity: 'orders',
        entity_id: order.id,
        diff: { 
          from: 'preparing', 
          to: 'dining', 
          reason: 'kitchen_forgot_ready_button',
          override_by: employee.id
        }
      });

      toast({
        title: 'Order Force-Progressed',
        description: 'Order moved directly to dining stage.',
      });

      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tables-with-orders'] });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Override Failed',
        description: error.message,
      });
    } finally {
      setIsOverriding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Table {table.label}</span>
            <Badge variant="outline">Order #{order.id.slice(0, 8)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Timeline */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Order Progress</h4>
            <div className="space-y-0">
              <TimelineItem
                icon={<ShoppingCart />}
                title="Order Placed"
                timestamp={order.created_at}
                status="completed"
              />
              <TimelineItem
                icon={<ChefHat />}
                title="Kitchen Preparing"
                timestamp={['preparing', 'kitchen_queue'].includes(order.status) ? order.created_at : null}
                status={
                  ['preparing', 'kitchen_queue'].includes(order.status) ? 'active' : 
                  ['ready', 'serving', 'dining', 'delivered', 'payment', 'completed'].includes(order.status) ? 'completed' : 
                  'pending'
                }
              />
              <TimelineItem
                icon={<Truck />}
                title="Being Served / Dining"
                timestamp={order.serving_at || order.dining_at || order.delivered_at}
                status={
                  ['serving', 'dining'].includes(order.status) ? 'active' :
                  ['delivered', 'payment', 'completed'].includes(order.status) ? 'completed' :
                  'pending'
                }
              />
              <TimelineItem
                icon={<DollarSign />}
                title="Payment Complete"
                timestamp={order.paid_at}
                status={order.paid_at ? 'completed' : 'pending'}
              />
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Items</h4>
            <div className="space-y-1">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.menu_items?.name}
                  </span>
                  <span className="font-medium">
                    RM {(item.quantity * item.unit_price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>RM {order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {order.status === 'preparing' && (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleManualBump}
                  disabled={isBumping}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Mark as Delivered (Normal)
                </Button>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleAdminOverride}
                  disabled={isOverriding}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Admin Override: Force to Dining
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  ⚠️ Use override only if kitchen forgot to click "Ready"
                </p>
              </>
            )}

            {(['delivered', 'dining'].includes(order.status)) && (
              <Button
                className="w-full"
                size="lg"
                onClick={onPayment}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Process Payment - RM {order.total.toFixed(2)}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
