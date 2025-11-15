import { PaymentModal } from '@/components/pos/PaymentModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface TablePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  table: any;
  onSuccess: () => void;
}

export function TablePaymentModal({ open, onOpenChange, order, table, onSuccess }: TablePaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePaymentSuccess = async () => {
    try {
      // Update order to completed
      await supabase
        .from('orders')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // Free up the table
      await supabase
        .from('tables')
        .update({
          status: 'available',
          current_order_id: null,
          seated_at: null,
        })
        .eq('id', table.id);

      toast({
        title: 'Payment Complete',
        description: `Table ${table.label} is now available`,
      });

      queryClient.invalidateQueries({ queryKey: ['tables'] });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to complete payment',
        description: error.message,
      });
    }
  };

  return (
    <PaymentModal
      open={open}
      onOpenChange={onOpenChange}
      orderId={order.id}
      orderNumber={order.id.slice(0, 8)}
      total={order.total}
      onPaymentSuccess={handlePaymentSuccess}
    />
  );
}
