import { ResponsiveModal } from '@/components/pos/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { createPaymentProvider } from '@/lib/payments/PaymentProvider';
import { QrCode, Banknote, Loader2, FileText, Delete } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generate58mmReceipt } from '@/lib/print/receiptGenerator';
import { cn } from '@/lib/utils';

type PaymentProviderType = 'duitnow' | 'tng' | 'stripe' | 'billplz';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  total: number;
  onPaymentSuccess: (orderId?: string, method?: string, total?: number, change?: number) => Promise<void>;
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>('cash');
  const [qrProvider, setQrProvider] = useState<PaymentProviderType>('duitnow');
  const [cashReceived, setCashReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [enableEInvoice, setEnableEInvoice] = useState(false);

  const change = cashReceived ? Math.max(0, parseFloat(cashReceived) - total) : 0;

  const handleNumpadPress = (key: string) => {
    if (key === 'clear') {
      setCashReceived('');
    } else if (key === 'backspace') {
      setCashReceived(prev => prev.slice(0, -1));
    } else if (key === '.') {
      // Only allow one decimal point
      if (!cashReceived.includes('.')) {
        setCashReceived(prev => prev + '.');
      }
    } else {
      // Limit to 2 decimal places
      const parts = cashReceived.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      setCashReceived(prev => prev + key);
    }
  };

  const quickAmounts = [
    { label: 'Exact', value: total },
    { label: 'RM 20', value: 20 },
    { label: 'RM 50', value: 50 },
    { label: 'RM 100', value: 100 },
  ];

  const numpadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
  ];

  // Track payment initiation
  useEffect(() => {
    if (open && orderId) {
      // Set status to 'payment' when payment modal opens
      supabase
        .from('orders')
        .update({ 
          status: 'payment',
          payment_initiated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to update payment status:', error);
          } else {
            console.log('✅ Payment initiated for order:', orderId);
          }
        });
    }
  }, [open, orderId]);

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

      // Get organization_id from order
      const { data: orderData } = await supabase
        .from('orders')
        .select('organization_id')
        .eq('id', orderId)
        .single();

      if (!orderData?.organization_id) {
        throw new Error('Could not determine organization');
      }

      // Create payment record
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          organization_id: orderData.organization_id,
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

      // Update order status and e-invoice flag
      await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          paid_at: new Date().toISOString(),
          einvoice_enabled: enableEInvoice 
        })
        .eq('id', orderId);

      // Get order details to check for customer
      const { data: order } = await supabase
        .from('orders')
        .select('customer_id, total')
        .eq('id', orderId)
        .single();

      // If customer linked, credit loyalty points
      if (order?.customer_id) {
        const pointsEarned = Math.floor(order.total * 10); // RM 1 = 10 points
        
        const { error: loyaltyError } = await supabase.rpc('credit_loyalty_points', {
          customer_id_param: order.customer_id,
          points_param: pointsEarned,
          order_id_param: orderId,
        });

        if (!loyaltyError) {
          toast({
            title: 'Loyalty Points Earned!',
            description: `+${pointsEarned} points added to account`,
          });
        }
      }

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
        einvoice_enabled: enableEInvoice,
      });
      
      console.log('📄 Printing receipt:', receiptHtml);

      console.log('💳 Payment completed, calling onPaymentSuccess with:', {
        orderId,
        method,
        total,
        changeGiven
      });

      toast({
        title: 'Payment Successful',
        description: `Order #${orderNumber} paid. Receipt printed.`,
      });

      // First trigger the success handler (which will show print preview) and wait for it
      await onPaymentSuccess(orderId, method, total, changeGiven);
      
      // Then close this modal
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
    <ResponsiveModal 
      open={open} 
      onOpenChange={onOpenChange}
      title={`Payment - RM ${total.toFixed(2)}`}
      description="Select payment method and complete transaction"
      side="bottom"
      size="lg"
    >
      {/* E-Invoice Toggle */}
      <div className="flex items-center space-x-2 mb-4 p-3 bg-muted/30 rounded-lg">
        <Checkbox 
          id="einvoice" 
          checked={enableEInvoice}
          onCheckedChange={(checked) => setEnableEInvoice(checked as boolean)}
        />
        <Label 
          htmlFor="einvoice" 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Generate e-Invoice (MyInvois)
        </Label>
      </div>

      <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
        <TabsList className="grid w-full grid-cols-2 h-14">
          <TabsTrigger value="cash" className="text-base h-12">
            <Banknote className="h-5 w-5 mr-2" />
            Cash
          </TabsTrigger>
          <TabsTrigger value="qr" className="text-base h-12">
            <QrCode className="h-5 w-5 mr-2" />
            QR Payment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qr" className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={qrProvider === 'duitnow' ? 'default' : 'outline'}
              onClick={() => setQrProvider('duitnow')}
              className="flex-1 h-14 text-base"
              size="lg"
            >
              DuitNow QR
            </Button>
            <Button
              variant={qrProvider === 'tng' ? 'default' : 'outline'}
              onClick={() => setQrProvider('tng')}
              className="flex-1 h-14 text-base"
              size="lg"
            >
              Touch 'n Go
            </Button>
          </div>

          {!qrCodeUrl ? (
            <Button
              onClick={handleGenerateQR}
              disabled={isProcessing}
              className="w-full h-16 text-lg"
              size="lg"
            >
              {isProcessing ? (
                <Loader2 className="h-6 w-6 mr-2 animate-spin" />
              ) : (
                <QrCode className="h-6 w-6 mr-2" />
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

        <TabsContent value="cash" className="py-4">
          {/* 2-Column Layout: Info Left, Numpad Right */}
          <div className="grid grid-cols-2 gap-6">
            {/* LEFT COLUMN: Display Info Only */}
            <div className="space-y-4">
              {/* Total Due - Large Display */}
              <div className="bg-muted/50 rounded-xl p-4 border-2 border-border">
                <p className="text-sm text-muted-foreground mb-1">Total Due</p>
                <p className="text-4xl font-bold text-foreground">RM {total.toFixed(2)}</p>
              </div>

              {/* Cash Received Display */}
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Cash Received</p>
                <p className="text-3xl font-bold text-foreground">
                  {cashReceived ? `RM ${parseFloat(cashReceived).toFixed(2)}` : 'RM 0.00'}
                </p>
              </div>

              {/* Change Due Display */}
              {cashReceived && parseFloat(cashReceived) >= total && (
                <div className="bg-success/10 rounded-lg p-4 border-2 border-success/20">
                  <p className="text-sm text-muted-foreground mb-1">Change Due</p>
                  <p className="text-3xl font-bold text-success">
                    RM {change.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Quick Amounts + Numpad */}
            <div className="space-y-4">
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount.label}
                    variant="outline"
                    className="h-12 text-base font-semibold hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                    onClick={() => setCashReceived(amount.value.toFixed(2))}
                  >
                    {amount.label}
                  </Button>
                ))}
              </div>

              {/* Touch-Optimized Numpad */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                {numpadKeys.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-3 gap-2">
                    {row.map((key) => (
                      <Button
                        key={key}
                        variant="secondary"
                        className={cn(
                          "h-16 text-2xl font-bold hover:bg-primary hover:text-primary-foreground transition-all active:scale-95",
                          key === 'backspace' && "text-lg"
                        )}
                        onClick={() => handleNumpadPress(key)}
                      >
                        {key === 'backspace' ? <Delete className="h-6 w-6" /> : key.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Complete Payment Button - Full Width Below */}
          <Button
            onClick={handleCashPayment}
            disabled={isProcessing || !cashReceived || parseFloat(cashReceived) < total}
            className="w-full h-16 text-xl font-bold mt-6"
            size="lg"
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 mr-2 animate-spin" />
            ) : (
              <Banknote className="h-6 w-6 mr-2" />
            )}
            Complete Payment
          </Button>
        </TabsContent>
      </Tabs>
    </ResponsiveModal>
  );
}
