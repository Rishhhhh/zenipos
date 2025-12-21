import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TimelineItem } from './TimelineItem';
import { ShoppingCart, ChefHat, Truck, DollarSign, AlertTriangle, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useNavigate } from 'react-router-dom';

interface TableOrderDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: any;
  onPayment: () => void;
}

export function TableOrderDetails({ open, onOpenChange, table, onPayment }: TableOrderDetailsProps) {
  const { isMobile } = useDeviceDetection();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isBumping, setIsBumping] = useState(false);
  const [isOverriding, setIsOverriding] = useState(false);
  
  // Handle multiple orders for a table
  const orders = table?.current_orders || [];
  if (orders.length === 0) return null;

  // Consolidate all order items and calculate combined totals
  const allItems = orders.flatMap((order: any) => 
    order.order_items?.map((item: any) => ({
      ...item,
      orderId: order.id,
      orderCreatedAt: order.created_at
    })) || []
  );
  
  const combinedSubtotal = orders.reduce((sum: number, order: any) => sum + (order.subtotal || order.total || 0), 0);
  const combinedTax = orders.reduce((sum: number, order: any) => sum + (order.tax || 0), 0);
  const combinedTotal = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
  
  // Most recent order status for timeline
  const mostRecentOrder = orders[orders.length - 1];
  const oldestOrder = orders[0];

  const handleAddMoreItems = () => {
    navigate('/pos', {
      state: {
        tableId: table.id,
        existingOrderId: mostRecentOrder.id,
        returnTo: '/tables',
      }
    });
    onOpenChange(false);
  };

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

      // Update ALL orders for this table to delivered
      const orderIds = orders.map((o: any) => o.id);
      await supabase
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          delivered_by: employee?.id,
        })
        .in('id', orderIds);

      toast({
        title: 'All Orders Delivered',
        description: `${orders.length} order(s) marked as delivered. Ready for payment.`,
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

      // Force ALL orders from 'preparing' directly to 'dining'
      const orderIds = orders.map((o: any) => o.id);
      await supabase
        .from('orders')
        .update({
          status: 'dining',
          dining_at: new Date().toISOString(),
          ready_at: new Date().toISOString(),
          serving_at: new Date().toISOString(),
        })
        .in('id', orderIds);

      // Log admin override action
      await supabase.from('audit_log').insert(
        orderIds.map((orderId: string) => ({
          actor: user.id,
          action: 'admin_override_to_dining',
          entity: 'orders',
          entity_id: orderId,
          diff: { 
            from: 'preparing', 
            to: 'dining', 
            reason: 'kitchen_forgot_ready_button',
            override_by: employee.id
          }
        }))
      );

      toast({
        title: 'All Orders Force-Progressed',
        description: `${orders.length} order(s) moved to dining stage.`,
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

  // Shared content component
  const DetailsContent = () => (
    <>
      {/* Multiple Orders Info */}
      {orders.length > 1 && (
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium">
            {orders.length} orders combined for this table
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            First order: {new Date(oldestOrder.created_at).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Order Timeline - based on most recent order */}
      <div>
        <h4 className="text-sm font-semibold mb-4">Order Progress</h4>
        <div className="space-y-0">
          <TimelineItem
            icon={<ShoppingCart />}
            title="Order Placed"
            timestamp={oldestOrder.created_at}
            status="completed"
          />
          <TimelineItem
            icon={<ChefHat />}
            title="Kitchen Preparing"
            timestamp={['preparing', 'kitchen_queue'].includes(mostRecentOrder.status) ? mostRecentOrder.created_at : null}
            status={
              ['preparing', 'kitchen_queue'].includes(mostRecentOrder.status) ? 'active' : 
              ['ready', 'serving', 'dining', 'delivered', 'payment', 'completed'].includes(mostRecentOrder.status) ? 'completed' : 
              'pending'
            }
          />
          <TimelineItem
            icon={<Truck />}
            title="Being Served / Dining"
            timestamp={mostRecentOrder.serving_at || mostRecentOrder.dining_at || mostRecentOrder.delivered_at}
            status={
              ['serving', 'dining'].includes(mostRecentOrder.status) ? 'active' :
              ['delivered', 'payment', 'completed'].includes(mostRecentOrder.status) ? 'completed' :
              'pending'
            }
          />
          <TimelineItem
            icon={<DollarSign />}
            title="Payment Complete"
            timestamp={mostRecentOrder.paid_at}
            status={mostRecentOrder.paid_at ? 'completed' : 'pending'}
          />
        </div>
      </div>

      <Separator />

      {/* Consolidated Order Items */}
      <div>
        <h4 className="text-sm font-semibold mb-2">All Items ({allItems.length})</h4>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {allItems.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity}x {item.menu_items?.name}
                {orders.length > 1 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (#{item.orderId.slice(0, 6)})
                  </span>
                )}
              </span>
              <span className="font-medium">
                RM {(item.quantity * item.unit_price).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <Separator className="my-2" />
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>RM {combinedSubtotal.toFixed(2)}</span>
          </div>
          {combinedTax > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tax</span>
              <span>RM {combinedTax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>RM {combinedTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Add More Items Button - Always visible for active orders */}
        {['preparing', 'delivered', 'dining'].includes(mostRecentOrder.status) && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleAddMoreItems}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add More Items
          </Button>
        )}

        {mostRecentOrder.status === 'preparing' && (
          <>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleManualBump}
              disabled={isBumping}
            >
              <Truck className="h-4 w-4 mr-2" />
              Mark All as Delivered
            </Button>

            <Button
              variant="destructive"
              className="w-full"
              onClick={handleAdminOverride}
              disabled={isOverriding}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Admin Override: Force All to Dining
            </Button>
          </>
        )}

        {(mostRecentOrder.status === 'delivered' || mostRecentOrder.status === 'dining') && (
          <Button
            onClick={onPayment}
            className="w-full"
            size="lg"
          >
            <DollarSign className="h-5 w-5 mr-2" />
            Process Payment (RM {combinedTotal.toFixed(2)})
          </Button>
        )}
      </div>
    </>
  );

  // Mobile: Use Sheet (slides from bottom)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto pb-24">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Table {table.label}</span>
              <Badge variant="outline">
                {orders.length === 1 ? `Order #${orders[0].id.slice(0, 8)}` : `${orders.length} Orders`}
              </Badge>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <DetailsContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop/Tablet: Use Dialog (centered modal)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Table {table.label}</span>
            <Badge variant="outline">
              {orders.length === 1 ? `Order #${orders[0].id.slice(0, 8)}` : `${orders.length} Orders`}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <DetailsContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
