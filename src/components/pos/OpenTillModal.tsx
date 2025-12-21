import { useState } from 'react';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OpenTillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  employeeId: string;
  shiftId: string;
  onSuccess: (tillSessionId: string) => void;
  onOpenTill: (data: {
    employeeId: string;
    shiftId: string;
    openingFloat: number;
    denominations: any;
  }) => Promise<any>;
}

// RM denominations including coins
const DENOMINATIONS = [
  { value: 100, label: 'RM 100' },
  { value: 50, label: 'RM 50' },
  { value: 20, label: 'RM 20' },
  { value: 10, label: 'RM 10' },
  { value: 5, label: 'RM 5' },
  { value: 1, label: 'RM 1' },
  { value: 0.50, label: '50 sen' },
  { value: 0.20, label: '20 sen' },
  { value: 0.10, label: '10 sen' },
  { value: 0.05, label: '5 sen' },
];

export function OpenTillModal({
  open,
  onOpenChange,
  employeeName,
  employeeId,
  shiftId,
  onSuccess,
  onOpenTill,
}: OpenTillModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [denominations, setDenominations] = useState<Record<number, number>>({
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    1: 0,
    0.50: 0,
    0.20: 0,
    0.10: 0,
    0.05: 0,
  });

  const updateDenomination = (value: number, count: string) => {
    const numCount = Math.max(0, parseInt(count) || 0);
    setDenominations((prev) => ({ ...prev, [value]: numCount }));
  };

  const totalOpeningBalance = DENOMINATIONS.reduce(
    (sum, denom) => sum + denom.value * (denominations[denom.value] || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalOpeningBalance <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Opening Balance',
        description: 'Opening balance must be greater than RM 0.00',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await onOpenTill({
        employeeId,
        shiftId,
        openingFloat: totalOpeningBalance,
        denominations,
      });

      toast({
        title: 'Till Opened',
        description: `Starting balance: RM ${totalOpeningBalance.toFixed(2)}`,
      });

      onSuccess(session.id);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Open Till',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassModal
      open={open}
      onOpenChange={(value) => {
        // Prevent closing without completing - till is mandatory
        if (!value) {
          toast({
            variant: 'destructive',
            title: 'Till Required',
            description: 'You must count and enter your opening cash to start your shift.',
          });
          return;
        }
        onOpenChange(value);
      }}
      title="Open Till Session"
      description={`Good day, ${employeeName}! Please count your opening cash.`}
      size="lg"
      variant="default"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-muted/30 p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Denomination Breakdown</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
            {DENOMINATIONS.map((denom) => (
              <div key={denom.value} className="flex items-center gap-2">
                <Label htmlFor={`denom-${denom.value}`} className="text-sm min-w-[60px]">
                  {denom.label}
                </Label>
                <span className="text-muted-foreground text-sm">×</span>
                <Input
                  id={`denom-${denom.value}`}
                  type="number"
                  min="0"
                  value={denominations[denom.value] || ''}
                  onChange={(e) => updateDenomination(denom.value, e.target.value)}
                  className="w-16 text-center h-8"
                  disabled={isSubmitting}
                  placeholder="0"
                />
                <span className="text-sm font-medium min-w-[70px] text-right">
                  RM {(denom.value * (denominations[denom.value] || 0)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total Opening Balance:</span>
              <span className="text-2xl font-bold text-primary">
                RM {totalOpeningBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="w-full" disabled={isSubmitting || totalOpeningBalance <= 0}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Open Till & Start Shift
          </Button>
        </div>
      </form>
    </GlassModal>
  );
}