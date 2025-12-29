import { useState, useEffect } from 'react';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wallet, TrendingUp, AlertTriangle, CheckCircle, Banknote, Coins, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

const NOTES = [
  { value: 100, label: 'RM 100', color: 'bg-emerald-500/10 border-emerald-500/30' },
  { value: 50, label: 'RM 50', color: 'bg-teal-500/10 border-teal-500/30' },
  { value: 20, label: 'RM 20', color: 'bg-amber-500/10 border-amber-500/30' },
  { value: 10, label: 'RM 10', color: 'bg-rose-500/10 border-rose-500/30' },
  { value: 5, label: 'RM 5', color: 'bg-green-500/10 border-green-500/30' },
  { value: 1, label: 'RM 1', color: 'bg-blue-500/10 border-blue-500/30' },
];

const COINS = [
  { value: 0.50, label: '50¢' },
  { value: 0.20, label: '20¢' },
  { value: 0.10, label: '10¢' },
  { value: 0.05, label: '5¢' },
];

const VARIANCE_THRESHOLD = 2.00;

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
    100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0,
    0.50: 0, 0.20: 0, 0.10: 0, 0.05: 0,
  });
  const [varianceReason, setVarianceReason] = useState('');
  const [calculatedExpectedCash, setCalculatedExpectedCash] = useState(tillSession?.expected_cash || 0);

  useEffect(() => {
    if (tillSession?.id && open) {
      supabase
        .from('till_sessions')
        .select('expected_cash')
        .eq('id', tillSession.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setCalculatedExpectedCash(Number(data.expected_cash));
          }
        });
    }
  }, [tillSession?.id, open]);

  const updateDenomination = (value: number, count: string) => {
    const numCount = Math.max(0, parseInt(count) || 0);
    setDenominations((prev) => ({ ...prev, [value]: numCount }));
  };

  const actualCashCounted = [...NOTES, ...COINS].reduce(
    (sum, denom) => sum + denom.value * (denominations[denom.value] || 0),
    0
  );

  const expectedCash = calculatedExpectedCash || tillSession?.expected_cash || 0;
  const openingFloat = tillSession?.opening_float || 0;
  const variance = actualCashCounted - expectedCash;
  const hasSignificantVariance = Math.abs(variance) > VARIANCE_THRESHOLD;

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
        description: `Please explain the variance exceeding RM ${VARIANCE_THRESHOLD.toFixed(2)}`,
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
      title="Close Till Session"
      description="Count your cash and end your shift"
      size="lg"
      variant="default"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Shift Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/50 border border-border p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-medium">Opening Float</span>
            </div>
            <p className="text-xl font-bold tabular-nums">RM {openingFloat.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
            <div className="flex items-center gap-2 text-primary mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Expected Cash</span>
            </div>
            <p className="text-xl font-bold text-primary tabular-nums">RM {expectedCash.toFixed(2)}</p>
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Banknote className="h-4 w-4" />
            <span>Count Notes</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {NOTES.map((denom) => {
              const count = denominations[denom.value] || 0;
              const subtotal = denom.value * count;
              return (
                <div
                  key={denom.value}
                  className={`relative rounded-xl border p-3 transition-all ${denom.color} ${
                    count > 0 ? 'ring-1 ring-primary/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{denom.label}</span>
                    {count > 0 && (
                      <span className="text-xs font-medium text-primary">
                        RM {subtotal.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">×</span>
                    <Input
                      type="number"
                      min="0"
                      value={count || ''}
                      onChange={(e) => updateDenomination(denom.value, e.target.value)}
                      className="h-9 text-center font-medium bg-background/80"
                      disabled={isSubmitting}
                      placeholder="0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coins Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Coins className="h-4 w-4" />
            <span>Count Coins</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {COINS.map((denom) => {
              const count = denominations[denom.value] || 0;
              return (
                <div
                  key={denom.value}
                  className={`relative rounded-xl border border-border bg-muted/30 p-2.5 transition-all ${
                    count > 0 ? 'ring-1 ring-primary/50 bg-primary/5' : ''
                  }`}
                >
                  <div className="text-center mb-1.5">
                    <span className="font-medium text-sm">{denom.label}</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={count || ''}
                    onChange={(e) => updateDenomination(denom.value, e.target.value)}
                    className="h-8 text-center text-sm font-medium bg-background/80"
                    disabled={isSubmitting}
                    placeholder="0"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Total & Variance Section */}
        <div className="space-y-3">
          {/* Actual Cash Total */}
          <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actual Cash Counted</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {Object.values(denominations).filter(v => v > 0).length} denomination(s)
                </p>
              </div>
              <p className="text-3xl font-bold text-primary tabular-nums">
                RM {actualCashCounted.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Variance Display */}
          {actualCashCounted > 0 && (
            <div
              className={`rounded-xl border p-4 flex items-center justify-between ${
                variance === 0
                  ? 'bg-green-500/10 border-green-500/30'
                  : hasSignificantVariance
                  ? 'bg-destructive/10 border-destructive/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {variance === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : variance > 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-amber-500" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-destructive" />
                )}
                <div>
                  <p className="font-medium text-sm">
                    {variance === 0
                      ? 'Perfectly Balanced'
                      : variance > 0
                      ? 'Cash Over'
                      : 'Cash Short'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasSignificantVariance ? 'Explanation required' : 'Within acceptable range'}
                  </p>
                </div>
              </div>
              <p className={`text-xl font-bold tabular-nums ${
                variance === 0 ? 'text-green-500' : hasSignificantVariance ? 'text-destructive' : 'text-amber-500'
              }`}>
                {variance > 0 ? '+' : ''}RM {variance.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Variance Reason */}
        {hasSignificantVariance && actualCashCounted > 0 && (
          <div className="space-y-2">
            <Label htmlFor="variance-reason" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Variance Explanation Required
            </Label>
            <Textarea
              id="variance-reason"
              value={varianceReason}
              onChange={(e) => setVarianceReason(e.target.value)}
              placeholder="Explain the reason for the cash variance..."
              className="min-h-[80px] resize-none"
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-11"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 h-11 font-semibold gap-2"
            disabled={isSubmitting || actualCashCounted <= 0 || (hasSignificantVariance && !varianceReason.trim())}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Close Till
          </Button>
        </div>
      </form>
    </GlassModal>
  );
}