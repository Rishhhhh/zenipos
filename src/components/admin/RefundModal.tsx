import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert } from 'lucide-react';
import { createPaymentProvider } from '@/lib/payments/PaymentProvider';
import { generateRefundReceipt } from '@/lib/print/receiptGenerator';

interface RefundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    order_id: string;
    amount: number;
    provider?: string;
    provider_ref?: string;
  };
  onRefundSuccess: () => void;
}

export function RefundModal({
  open,
  onOpenChange,
  payment,
  onRefundSuccess,
}: RefundModalProps) {
  const { toast } = useToast();
  const [managerPin, setManagerPin] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRefund = async () => {
    if (!managerPin || managerPin.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid PIN',
        description: 'Please enter a 6-digit manager PIN',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate manager role via edge function
      const { data: validationResult, error: validationError } = await supabase.functions.invoke(
        'validate-manager-pin',
        {
          body: { user_id: user.id, pin: managerPin },
        }
      );

      if (validationError || !validationResult?.valid) {
        throw new Error('Invalid manager PIN or insufficient permissions');
      }

      // Process refund with payment provider
      if (payment.provider && payment.provider_ref) {
        const provider = createPaymentProvider(payment.provider as any);
        const success = await provider.refund(payment.provider_ref, payment.amount);
        
        if (!success) {
          throw new Error('Provider refund failed');
        }
      }

      // Create refund record
      const { data: refund, error: refundError } = await supabase
        .from('refunds')
        .insert({
          payment_id: payment.id,
          order_id: payment.order_id,
          amount: payment.amount,
          reason,
          authorized_by: user.id,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (refundError) throw refundError;

      // Update payment status (note: no 'refunded' status in payment_status enum, using 'failed' as workaround)
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);

      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', payment.order_id);

      // Log audit
      await supabase.from('audit_log').insert({
        actor: user.id,
        action: 'refund_processed',
        entity: 'refunds',
        entity_id: refund.id,
        diff: { payment_id: payment.id, amount: payment.amount, reason },
      });

      // Print refund receipt
      const receiptHtml = generateRefundReceipt(
        {
          order_id: payment.order_id,
          order_number: 'REFUND',
          items: [],
          subtotal: payment.amount,
          tax: 0,
          total: payment.amount,
          timestamp: new Date(),
        },
        {
          refundId: refund.id,
          reason,
          authorizedBy: user.email || 'Manager',
        }
      );
      console.log('📄 Printing refund receipt:', receiptHtml);

      toast({
        title: 'Refund Processed',
        description: `RM ${payment.amount.toFixed(2)} refunded successfully`,
      });

      onRefundSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Refund Failed',
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
      setManagerPin('');
    }
  };

  return (
    <GlassModal 
      open={open} 
      onOpenChange={onOpenChange}
      title="Process Refund"
      size="md"
      variant="default"
    >
      <div className="space-y-4">
        <div className="bg-warning/10 p-4 rounded-lg">
          <p className="text-sm font-medium">Refund Amount</p>
          <p className="text-2xl font-bold">RM {payment.amount.toFixed(2)}</p>
        </div>

        <div>
          <Label htmlFor="pin">Manager PIN (Required)</Label>
          <Input
            id="pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={managerPin}
            onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, ''))}
            placeholder="6-digit PIN"
            autoFocus
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter your manager PIN to authorize this refund
          </p>
        </div>

        <div>
          <Label htmlFor="reason">Reason (Optional)</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Customer request, wrong order..."
            rows={3}
          />
        </div>

        <Button
          onClick={handleRefund}
          disabled={isProcessing || !managerPin}
          className="w-full"
          variant="destructive"
          size="lg"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ShieldAlert className="h-4 w-4 mr-2" />
          )}
          Process Refund
        </Button>
      </div>
    </GlassModal>
  );
}
