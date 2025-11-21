import { useState } from 'react';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CloseTillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tillSession: {
    id: string;
    opening_float: number;
    expected_cash: number;
  } | null;
  onCloseTill: (data: {
    closingFloat: number;
    actualCash: number;
    variance: number;
    varianceReason?: string;
    denominations: any;
  }) => Promise<void>;
  onSuccess: () => void;
}

const DENOMINATIONS = [
  { value: 100, label: 'RM 100' },
  { value: 50, label: 'RM 50' },
  { value: 10, label: 'RM 10' },
  { value: 5, label: 'RM 5' },
  { value: 1, label: 'RM 1' },
];

export function CloseTillModal({
  open,
  onOpenChange,
  tillSession,
  onCloseTill,
  onSuccess,
}: CloseTillModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [denominations, setDenominations] = useState<Record<number, number>>({
    100: 0,
    50: 0,
    10: 0,
    5: 0,
    1: 0,
  });
  const [varianceReason, setVarianceReason] = useState('');

  const updateDenomination = (value: number, count: string) => {
    const numCount = Math.max(0, parseInt(count) || 0);
    setDenominations((prev) => ({ ...prev, [value]: numCount }));
  };

  const actualCashCounted = DENOMINATIONS.reduce(
    (sum, denom) => sum + denom.value * (denominations[denom.value] || 0),
    0
  );

  const expectedCash = tillSession?.expected_cash || 0;
  const openingFloat = tillSession?.opening_float || 0;
  const variance = actualCashCounted - expectedCash;
  const hasSignificantVariance = Math.abs(variance) > 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (actualCashCounted <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Cash Count',
        description: 'Actual cash must be greater than RM 0.00',
      });
      return;
    }

    if (hasSignificantVariance && !varianceReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Reason Required',
        description: 'Please provide a reason for the variance greater than RM 5.00',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onCloseTill({
        closingFloat: actualCashCounted,
        actualCash: actualCashCounted,
        variance,
        varianceReason: hasSignificantVariance ? varianceReason : undefined,
        denominations,
      });

      toast({
        title: 'Till Closed',
        description: `Final balance: RM ${actualCashCounted.toFixed(2)}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Close Till',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title="📊 Close Till Session"
      description="Count your cash and end your shift"
      size="lg"
      variant="default"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shift Summary */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Shift Summary
          </h3>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Opening Balance:</span>
              <p className="font-semibold text-lg">RM {openingFloat.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Expected Cash:</span>
              <p className="font-semibold text-lg text-primary">RM {expectedCash.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Cash Count */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Count Your Cash</h3>
          </div>

          {DENOMINATIONS.map((denom) => (
            <div key={denom.value} className="grid grid-cols-[1fr,auto,auto] items-center gap-3">
              <Label htmlFor={`close-denom-${denom.value}`} className="text-base">
                {denom.label}
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">×</span>
                <Input
                  id={`close-denom-${denom.value}`}
                  type="number"
                  min="0"
                  value={denominations[denom.value]}
                  onChange={(e) => updateDenomination(denom.value, e.target.value)}
                  className="w-20 text-center"
                  disabled={isSubmitting}
                />
              </div>
              <div className="text-right font-medium min-w-[80px]">
                RM {(denom.value * denominations[denom.value]).toFixed(2)}
              </div>
            </div>
          ))}

          <div className="border-t pt-3 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Actual Cash Counted:</span>
              <span className="text-2xl font-bold text-primary">
                RM {actualCashCounted.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Variance Display */}
        {actualCashCounted > 0 && (
          <Alert variant={hasSignificantVariance ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  Variance: {variance > 0 ? '+' : ''}RM {variance.toFixed(2)} 
                  {variance > 0 ? ' (Over)' : variance < 0 ? ' (Short)' : ' (Balanced)'}
                </span>
                {hasSignificantVariance ? (
                  <span className="text-xs">⚠️ Reason required</span>
                ) : (
                  <span className="text-xs">✓ Within acceptable range</span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Variance Reason (if needed) */}
        {hasSignificantVariance && actualCashCounted > 0 && (
          <div>
            <Label htmlFor="variance-reason">Reason for Variance (Required)</Label>
            <Textarea
              id="variance-reason"
              value={varianceReason}
              onChange={(e) => setVarianceReason(e.target.value)}
              placeholder="Explain the reason for the variance..."
              className="mt-2"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1" 
            disabled={isSubmitting || actualCashCounted <= 0 || (hasSignificantVariance && !varianceReason.trim())}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Close Till ✅
          </Button>
        </div>
      </form>
    </GlassModal>
  );
}
