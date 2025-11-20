import { useState } from 'react';
import { ResponsiveModal } from '@/components/pos/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Banknote, 
  QrCode, 
  Smartphone,
  Plus,
  Trash2,
  Calculator,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentMethod {
  id: string;
  type: 'cash' | 'card' | 'qr' | 'mobile' | 'split';
  amount: number;
  tipAmount?: number;
  cardDetails?: {
    last4?: string;
    brand?: string;
    device?: string;
  };
}

interface EnhancedPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderTotal: number;
  onPaymentComplete: (payments: PaymentMethod[]) => Promise<void>;
}

const TIP_SUGGESTIONS = [
  { label: '10%', value: 0.10 },
  { label: '15%', value: 0.15 },
  { label: '18%', value: 0.18 },
  { label: '20%', value: 0.20 },
];

export function EnhancedPaymentModal({
  open,
  onOpenChange,
  orderTotal,
  onPaymentComplete,
}: EnhancedPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'single' | 'split'>('single');
  const [tipType, setTipType] = useState<'none' | 'percentage' | 'amount'>('none');
  const [tipPercentage, setTipPercentage] = useState(0.15);
  const [customTip, setCustomTip] = useState('');
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [currentPayment, setCurrentPayment] = useState<Partial<PaymentMethod>>({
    type: 'card',
    amount: 0,
  });
  const [cashReceived, setCashReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateTip = () => {
    if (tipType === 'none') return 0;
    if (tipType === 'percentage') return orderTotal * tipPercentage;
    return Number(customTip) || 0;
  };

  const tipAmount = calculateTip();
  const totalWithTip = orderTotal + tipAmount;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = totalWithTip - totalPaid;

  const handleAddPayment = () => {
    if (!currentPayment.type || !currentPayment.amount || currentPayment.amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (currentPayment.amount > remainingBalance) {
      toast.error('Payment amount exceeds remaining balance');
      return;
    }

    const newPayment: PaymentMethod = {
      id: crypto.randomUUID(),
      type: currentPayment.type as any,
      amount: currentPayment.amount,
      tipAmount: payments.length === 0 ? tipAmount : 0, // First payment gets the tip
    };

    setPayments([...payments, newPayment]);
    setCurrentPayment({ type: 'card', amount: 0 });
    toast.success('Payment method added');
  };

  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleCompleteSingle = async () => {
    if (!currentPayment.type) {
      toast.error('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    try {
      const payment: PaymentMethod = {
        id: crypto.randomUUID(),
        type: currentPayment.type as any,
        amount: totalWithTip,
        tipAmount,
      };

      if (currentPayment.type === 'cash') {
        const cash = Number(cashReceived);
        if (cash < totalWithTip) {
          toast.error('Insufficient cash received');
          setIsProcessing(false);
          return;
        }
        payment.amount = cash;
      }

      await onPaymentComplete([payment]);
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteSplit = async () => {
    if (Math.abs(remainingBalance) > 0.01) {
      toast.error('Payment does not cover total amount');
      return;
    }

    setIsProcessing(true);
    try {
      await onPaymentComplete(payments);
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setPaymentMethod('single');
    setTipType('none');
    setTipPercentage(0.15);
    setCustomTip('');
    setPayments([]);
    setCurrentPayment({ type: 'card', amount: 0 });
    setCashReceived('');
  };

  return (
    <ResponsiveModal 
      open={open} 
      onOpenChange={onOpenChange}
      title="Complete Payment"
      size="lg"
    >
        <div className="space-y-6">
          {/* Payment Type Selection */}
          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Payment</TabsTrigger>
              <TabsTrigger value="split">Split Tender</TabsTrigger>
            </TabsList>

            {/* Tip Selection */}
            <Card className="p-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4" />
                <Label>Gratuity</Label>
              </div>
              
              <RadioGroup value={tipType} onValueChange={(v) => setTipType(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="no-tip" />
                  <Label htmlFor="no-tip">No Tip</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage-tip" />
                  <Label htmlFor="percentage-tip">Percentage</Label>
                </div>
                
                {tipType === 'percentage' && (
                  <div className="ml-6 flex gap-2 mt-2">
                    {TIP_SUGGESTIONS.map((tip) => (
                      <Button
                        key={tip.value}
                        variant={tipPercentage === tip.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTipPercentage(tip.value)}
                      >
                        {tip.label}
                      </Button>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="amount" id="custom-tip" />
                  <Label htmlFor="custom-tip">Custom Amount</Label>
                </div>
                
                {tipType === 'amount' && (
                  <Input
                    type="number"
                    placeholder="Enter tip amount"
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    className="ml-6 mt-2 max-w-[200px]"
                  />
                )}
              </RadioGroup>

              {tipAmount > 0 && (
                <div className="mt-3 p-2 bg-accent rounded-md">
                  <p className="text-sm">
                    Tip: <span className="font-bold">RM {tipAmount.toFixed(2)}</span>
                  </p>
                </div>
              )}
            </Card>

            {/* Single Payment Tab */}
            <TabsContent value="single" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card
                  className={cn(
                    'p-4 cursor-pointer transition-colors',
                    currentPayment.type === 'card' && 'border-primary bg-accent'
                  )}
                  onClick={() => setCurrentPayment({ ...currentPayment, type: 'card' })}
                >
                  <div className="flex flex-col items-center gap-2">
                    <CreditCard className="w-8 h-8" />
                    <span className="font-medium">Card</span>
                  </div>
                </Card>

                <Card
                  className={cn(
                    'p-4 cursor-pointer transition-colors',
                    currentPayment.type === 'cash' && 'border-primary bg-accent'
                  )}
                  onClick={() => setCurrentPayment({ ...currentPayment, type: 'cash' })}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Banknote className="w-8 h-8" />
                    <span className="font-medium">Cash</span>
                  </div>
                </Card>

                <Card
                  className={cn(
                    'p-4 cursor-pointer transition-colors',
                    currentPayment.type === 'qr' && 'border-primary bg-accent'
                  )}
                  onClick={() => setCurrentPayment({ ...currentPayment, type: 'qr' })}
                >
                  <div className="flex flex-col items-center gap-2">
                    <QrCode className="w-8 h-8" />
                    <span className="font-medium">QR Pay</span>
                  </div>
                </Card>

                <Card
                  className={cn(
                    'p-4 cursor-pointer transition-colors',
                    currentPayment.type === 'mobile' && 'border-primary bg-accent'
                  )}
                  onClick={() => setCurrentPayment({ ...currentPayment, type: 'mobile' as any })}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Smartphone className="w-8 h-8" />
                    <span className="font-medium">Mobile Pay</span>
                  </div>
                </Card>
              </div>

              {currentPayment.type === 'cash' && (
                <div>
                  <Label>Cash Received</Label>
                  <Input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="Enter amount received"
                    className="mt-2"
                  />
                  {Number(cashReceived) >= totalWithTip && (
                    <p className="text-sm mt-2 text-muted-foreground">
                      Change: RM {(Number(cashReceived) - totalWithTip).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span>RM {orderTotal.toFixed(2)}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tip:</span>
                    <span>RM {tipAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span>RM {totalWithTip.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handleCompleteSingle}
                disabled={isProcessing || !currentPayment.type}
                className="w-full"
                size="lg"
              >
                {isProcessing ? 'Processing...' : 'Complete Payment'}
              </Button>
            </TabsContent>

            {/* Split Tender Tab */}
            <TabsContent value="split" className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Payment Method</Label>
                  <Badge variant="outline">
                    Remaining: RM {remainingBalance.toFixed(2)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Button
                    variant={currentPayment.type === 'card' ? 'default' : 'outline'}
                    onClick={() => setCurrentPayment({ ...currentPayment, type: 'card' })}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Card
                  </Button>
                  <Button
                    variant={currentPayment.type === 'cash' ? 'default' : 'outline'}
                    onClick={() => setCurrentPayment({ ...currentPayment, type: 'cash' })}
                  >
                    <Banknote className="w-4 h-4 mr-2" />
                    Cash
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={currentPayment.amount || ''}
                    onChange={(e) => setCurrentPayment({ ...currentPayment, amount: Number(e.target.value) })}
                    placeholder="Amount"
                  />
                  <Button onClick={handleAddPayment}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPayment({ ...currentPayment, amount: remainingBalance })}
                  className="w-full mt-2"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Use Remaining Balance
                </Button>
              </Card>

              {/* Payment List */}
              {payments.length > 0 && (
                <div className="space-y-2">
                  {payments.map((payment, index) => (
                    <Card key={payment.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge>#{index + 1}</Badge>
                          <span className="capitalize">{payment.type}</span>
                          <span className="font-bold">RM {payment.amount.toFixed(2)}</span>
                          {payment.tipAmount && payment.tipAmount > 0 && (
                            <Badge variant="secondary">+RM {payment.tipAmount.toFixed(2)} tip</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePayment(payment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>RM {orderTotal.toFixed(2)}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tip:</span>
                    <span>RM {tipAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>RM {totalWithTip.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>Paid:</span>
                  <span>RM {totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Remaining:</span>
                  <span>RM {remainingBalance.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handleCompleteSplit}
                disabled={isProcessing || Math.abs(remainingBalance) > 0.01}
                className="w-full"
                size="lg"
              >
                {isProcessing ? 'Processing...' : 'Complete Split Payment'}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
    </ResponsiveModal>
  );
}
