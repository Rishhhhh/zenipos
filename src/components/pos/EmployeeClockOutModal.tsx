import { useState } from 'react';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Clock, Package, DollarSign, AlertTriangle, Wallet, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CloseTillModal } from './CloseTillModal';
import { useTillSession } from '@/contexts/TillSessionContext';

interface EmployeeClockOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string;
  onSuccess: () => void;
}

export function EmployeeClockOutModal({ open, onOpenChange, shiftId, onSuccess }: EmployeeClockOutModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeTillSession, closeTillSession } = useTillSession();
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [showCloseTill, setShowCloseTill] = useState(false);

  const { data: shiftSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['shift-summary', shiftId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_shift_summary', {
        shift_id_param: shiftId,
      });
      if (error) throw error;
      return data?.[0];
    },
    enabled: open && !!shiftId,
  });

  const clockOut = useMutation({
    mutationFn: async () => {
      // Double-check till is closed
      if (activeTillSession && activeTillSession.status === 'open') {
        throw new Error('Please close your till before clocking out');
      }

      // Update shift with clock-out time
      const { error: updateError } = await supabase
        .from('shifts')
        .update({
          clock_out_at: new Date().toISOString(),
          break_minutes: breakMinutes || 0,
          status: 'closed',
        })
        .eq('id', shiftId);

      if (updateError) throw updateError;

      // Close shift and calculate summary via RPC
      const { error: closeError } = await supabase.rpc('close_shift', {
        shift_id_param: shiftId,
      });

      if (closeError) {
        console.warn('close_shift RPC warning:', closeError);
        // Don't throw - shift is already updated
      }
    },
    onSuccess: () => {
      toast({
        title: 'Clocked Out',
        description: 'Shift has been closed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['active-till-session'] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Clock Out Failed',
        description: error.message,
      });
    },
  });

  const handleTillClosed = () => {
    // Now that till is closed, proceed with clock out
    setShowCloseTill(false);
    clockOut.mutate();
  };

  const handleClockOutAttempt = () => {
    // Check if till is open - MUST close before clocking out
    if (activeTillSession && activeTillSession.status === 'open') {
      setShowCloseTill(true);
    } else {
      clockOut.mutate();
    }
  };

  const tillIsOpen = activeTillSession && activeTillSession.status === 'open';

  return (
    <>
      <GlassModal
        open={open && !showCloseTill}
        onOpenChange={onOpenChange}
        title="Clock Out"
        description="End your shift and close your till"
        size="md"
        variant="default"
      >
        <div className="space-y-4">
          {/* Alert if till is open - MANDATORY to close */}
          {tillIsOpen && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have an open till session. You <strong>must</strong> close your till and count cash before clocking out.
              </AlertDescription>
            </Alert>
          )}

          {/* Shift Summary */}
          {summaryLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : shiftSummary ? (
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Shift Started</p>
                  <p className="font-medium">
                    {new Date(shiftSummary.clock_in).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Orders Processed</p>
                  <p className="font-medium">{shiftSummary.orders || 0}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="font-medium">
                    RM {Number(shiftSummary.sales || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Till Summary if available */}
              {(shiftSummary.till_opening !== undefined || shiftSummary.till_expected !== undefined) && (
                <>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Till Summary</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Cash Sales:</span>
                        <span className="ml-2 font-medium">RM {Number(shiftSummary.cash_sales || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">QR Sales:</span>
                        <span className="ml-2 font-medium">RM {Number(shiftSummary.qr_sales || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No shift data available
            </div>
          )}

          <div>
            <Label htmlFor="breakMinutes">Break Time (minutes)</Label>
            <Input
              id="breakMinutes"
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              min={0}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Record any unpaid break time
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={clockOut.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClockOutAttempt}
              className="flex-1"
              disabled={clockOut.isPending}
              variant={tillIsOpen ? 'secondary' : 'default'}
            >
              {clockOut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tillIsOpen ? (
                <>
                  <Banknote className="h-4 w-4 mr-2" />
                  Close Till & Clock Out
                </>
              ) : (
                'Clock Out'
              )}
            </Button>
          </div>
        </div>
      </GlassModal>

      {activeTillSession && (
        <CloseTillModal
          open={showCloseTill}
          onOpenChange={setShowCloseTill}
          tillSession={activeTillSession}
          onCloseTill={closeTillSession}
          onSuccess={handleTillClosed}
        />
      )}
    </>
  );
}