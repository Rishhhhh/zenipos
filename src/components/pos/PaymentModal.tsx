import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { createPaymentProvider } from '@/lib/payments/PaymentProvider';
import { QrCode, Banknote, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generate58mmReceipt } from '@/lib/print/receiptGenerator';

type PaymentProviderType = 'duitnow' | 'tng' | 'stripe' | 'billplz';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  total: number;
  onPaymentSuccess: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  total,
  onPaymentSuccess,
}: PaymentModalProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>('qr');
  const [qrProvider, setQrProvider] = useState<PaymentProviderType>('duitnow');
  const [cashReceived, setCashReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const change = cashReceived ? Math.max(0, parseFloat(cashReceived) - total) : 0;

  const handleGenerateQR = async () => {
    setIsProcessing(true);
    try {
      const provider = createPaymentProvider(qrProvider);
      const result = await provider.generateQRPayment({
        amount: total,
        currency: 'MYR',
        order_id: orderId,
      });

      if (result.success && result.qr_code_url) {
        setQrCodeUrl(result.qr_code_url);
        setTransactionId(result.transaction_id!);
        
        // Start polling for payment verification
        pollPaymentStatus(provider, result.transaction_id!);
      } else {
        throw new Error(result.error || 'Failed to generate QR code');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = async (provider: any, txnId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;
      
      const isPaid = await provider.verifyPayment(txnId);
      
      if (isPaid) {
        clearInterval(poll);
        await completePayment(txnId, qrProvider);
      } else if (attempts >= maxAttempts) {
        clearInterval(poll);
        toast({
          variant: 'destructive',
          title: 'Payment Timeout',
          description: 'Payment verification timed out. Please check manually.',
        });
      }
    }, 5000);
  };

  const handleCashPayment = async () => {
    if (!cashReceived || parseFloat(cashReceived) < total) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Amount',
        description: 'Cash received is less than total amount',
      });
      return;
    }

    setIsProcessing(true);
    await completePayment(`cash_${Date.now()}`, 'cash', change);
  };

  const completePayment = async (
    txnId: string,
    method: string,
    changeGiven: number = 0
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create payment record
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          method: method === 'cash' ? 'cash' : 'qr',
          provider_ref: txnId,
          provider: method === 'cash' ? null : qrProvider,
          amount: total,
          change_given: changeGiven,
          status: 'completed',
        })
        .select()
        .single();

      if (error) throw error;

      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'done' })
        .eq('id', orderId);

      // Log audit
      await supabase.from('audit_log').insert({
        actor: user.id,
        action: 'payment_completed',
        entity: 'payments',
        entity_id: payment.id,
        diff: { order_id: orderId, amount: total, method },
      });

      // Print receipt
      const receiptHtml = generate58mmReceipt({
        order_id: orderId,
        order_number: orderNumber,
        items: [],
        subtotal: total / 1.06,
        tax: total * 0.06,
        total,
        payment_method: method.toUpperCase(),
        timestamp: new Date(),
      });
      
      console.log('📄 Printing receipt:', receiptHtml);

      toast({
        title: 'Payment Successful',
        description: `Order #${orderNumber} paid. Receipt printed.`,
      });

      onPaymentSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment - RM {total.toFixed(2)}</DialogTitle>
        </DialogHeader>

        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr">
              <QrCode className="h-4 w-4 mr-2" />
              QR Payment
            </TabsTrigger>
            <TabsTrigger value="cash">
              <Banknote className="h-4 w-4 mr-2" />
              Cash
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={qrProvider === 'duitnow' ? 'default' : 'outline'}
                onClick={() => setQrProvider('duitnow')}
                className="flex-1"
              >
                DuitNow QR
              </Button>
              <Button
                variant={qrProvider === 'tng' ? 'default' : 'outline'}
                onClick={() => setQrProvider('tng')}
                className="flex-1"
              >
                Touch 'n Go
              </Button>
            </div>

            {!qrCodeUrl ? (
              <Button
                onClick={handleGenerateQR}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4 mr-2" />
                )}
                Generate QR Code
              </Button>
            ) : (
              <div className="flex flex-col items-center py-8">
                <QrCode className="h-48 w-48 text-primary mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Scan with banking app
                </p>
                <Badge>{qrProvider.toUpperCase()}</Badge>
                <p className="text-xs text-muted-foreground mt-4">
                  Waiting for payment confirmation...
                </p>
                <Loader2 className="h-6 w-6 animate-spin mt-2" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="cash" className="space-y-4">
            <div>
              <Label htmlFor="cash">Cash Received (RM)</Label>
              <Input
                id="cash"
                type="number"
                step="0.01"
                min={total}
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder={total.toFixed(2)}
                autoFocus
              />
            </div>

            {cashReceived && parseFloat(cashReceived) >= total && (
              <div className="bg-success/10 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Change</p>
                <p className="text-2xl font-bold text-success">
                  RM {change.toFixed(2)}
                </p>
              </div>
            )}

            <Button
              onClick={handleCashPayment}
              disabled={isProcessing || !cashReceived || parseFloat(cashReceived) < total}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Banknote className="h-4 w-4 mr-2" />
              )}
              Complete Payment
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
