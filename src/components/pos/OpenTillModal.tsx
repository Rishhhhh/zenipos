import { useState, useEffect } from 'react';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, Banknote, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DenominationPresetSelector } from './DenominationPresetSelector';
import { TouchDenominationPad } from './TouchDenominationPad';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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

// RM denominations - Notes first, then coins
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
  const { employee, organization } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [denominations, setDenominations] = useState<Record<number, number>>({
    100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0,
    0.50: 0, 0.20: 0, 0.10: 0, 0.05: 0,
  });

  const { data: defaultPreset } = useQuery({
    queryKey: ['default-denomination-preset', employeeId, 'opening'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('denomination_presets')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_default', true)
        .in('preset_type', ['opening', 'both'])
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: open && !!employeeId,
  });

  useEffect(() => {
    if (open && defaultPreset?.denominations) {
      const numericDenoms: Record<number, number> = {};
      Object.entries(defaultPreset.denominations).forEach(([key, value]) => {
        numericDenoms[parseFloat(key)] = value as number;
      });
      setDenominations((prev) => ({ ...prev, ...numericDenoms }));
      toast({ title: 'Default Preset Loaded', description: `"${defaultPreset.name}" applied` });
    }
  }, [open, defaultPreset, toast]);

  const handlePresetSelect = (presetDenominations: Record<number, number>) => {
    setDenominations((prev) => ({ ...prev, ...presetDenominations }));
  };

  const handleDenominationChange = (value: number, count: number) => {
    setDenominations((prev) => ({ ...prev, [value]: count }));
  };

  const totalOpeningBalance = [...NOTES, ...COINS].reduce(
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
      description={`Welcome, ${employeeName}! Count your opening float.`}
      size="lg"
      variant="default"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Preset Controls */}
        {organization?.id && (
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span>Quick Actions</span>
            </div>
            <DenominationPresetSelector
              employeeId={employeeId}
              organizationId={organization.id}
              branchId={employee?.branch_id}
              presetType="opening"
              currentDenominations={denominations}
              onSelectPreset={handlePresetSelect}
            />
          </div>
        )}

        {/* Notes Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Banknote className="h-4 w-4" />
            <span>Tap to count notes</span>
          </div>
          <TouchDenominationPad
            denominations={NOTES}
            values={denominations}
            onValueChange={handleDenominationChange}
            disabled={isSubmitting}
            columns={3}
            variant="notes"
          />
        </div>

        {/* Coins Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Coins className="h-4 w-4" />
            <span>Tap to count coins</span>
          </div>
          <TouchDenominationPad
            denominations={COINS}
            values={denominations}
            onValueChange={handleDenominationChange}
            disabled={isSubmitting}
            columns={4}
            variant="coins"
          />
        </div>

        {/* Total Section */}
        <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Opening Float</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {Object.values(denominations).filter(v => v > 0).length} denomination(s) counted
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary tabular-nums">
                RM {totalOpeningBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-12 text-base font-semibold gap-2" 
          disabled={isSubmitting || totalOpeningBalance <= 0}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Wallet className="h-5 w-5" />
          )}
          Open Till & Start Shift
        </Button>
      </form>
    </GlassModal>
  );
}