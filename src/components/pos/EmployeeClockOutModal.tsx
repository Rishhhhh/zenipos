import { useState, useEffect } from 'react';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Clock, Package, DollarSign, AlertTriangle, Wallet, Banknote, ShieldCheck, Delete } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CloseTillModal } from './CloseTillModal';
import { useTillSession } from '@/contexts/TillSessionContext';
import { useShift } from '@/contexts/ShiftContext';

interface EmployeeClockOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId?: string | null;
  onSuccess: () => void;
}

export function EmployeeClockOutModal({ open, onOpenChange, shiftId: propShiftId, onSuccess }: EmployeeClockOutModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeTillSession, closeTillSession, isLoading: tillLoading, refreshSession } = useTillSession();
  const { activeShift, clearShift, isLoading: shiftLoading, refreshShift } = useShift();
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [showCloseTill, setShowCloseTill] = useState(false);
  
  // Manager PIN authorization state
  const [pinAuthorized, setPinAuthorized] = useState(false);
  const [authorizingManagerId, setAuthorizingManagerId] = useState<string | null>(null);
  const [managerPin, setManagerPin] = useState('');
  const [isValidatingPin, setIsValidatingPin] = useState(false);

  // Reset PIN authorization when modal closes
  useEffect(() => {
    if (!open) {
      setPinAuthorized(false);
      setAuthorizingManagerId(null);
      setManagerPin('');
    }
  }, [open]);

  // Eagerly refresh shift AND till session when modal opens to ensure we have latest data
  useEffect(() => {
    if (open) {
      refreshShift();
      refreshSession();
    }
  }, [open, refreshShift, refreshSession]);

  // Use shiftId from props if provided, otherwise from context
  const shiftId = propShiftId || activeShift?.id;

  // Validate manager PIN
  const handlePinSubmit = async () => {
    if (managerPin.length !== 6) return;
    
    setIsValidatingPin(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-manager-pin', {
        body: { pin: managerPin },
      });

      if (error || !data?.valid) {
        throw new Error('Invalid manager PIN');
      }

      const employee = data.employee;
      
      // Check if employee has manager or admin role
      if (!['admin', 'manager', 'owner'].includes(employee.role)) {
        throw new Error('Only managers/admins can authorize clock out');
      }

      toast({
        title: 'Authorized',
        description: `Clock out authorized by ${employee.name}`,
      });

      setPinAuthorized(true);
      setAuthorizingManagerId(employee.id);
      setManagerPin('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authorization Failed',
        description: error.message,
      });
      setManagerPin('');
    } finally {
      setIsValidatingPin(false);
    }
  };

  const handlePinDigit = (digit: string) => {
    if (managerPin.length < 6) {
      setManagerPin(prev => prev + digit);
    }
  };

  const handlePinBackspace = () => {
    setManagerPin(prev => prev.slice(0, -1));
  };

  const handlePinClear = () => {
    setManagerPin('');
  };

  const { data: shiftSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['shift-summary', shiftId],
    queryFn: async () => {
      if (!shiftId) return null;
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
      if (!shiftId) {
        throw new Error('No active shift to close');
      }

      // The UI now guarantees till is closed before calling mutate
      // No need for redundant check that causes race condition errors

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
      // Close modal FIRST to prevent flash of "no active shift" state
      onOpenChange(false);
      
      toast({
        title: 'Clocked Out',
        description: 'Shift has been closed successfully',
      });
      
      // Then clear shift and invalidate queries
      clearShift();
      
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['active-till-session'] });
      
      onSuccess();
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
    // Wait for till context to finish loading before making decision
    if (tillLoading) {
      toast({
        title: 'Please wait',
        description: 'Loading till session data...',
      });
      return;
    }
    
    // Check if till is open - MUST close before clocking out
    if (activeTillSession && activeTillSession.status === 'open') {
      setShowCloseTill(true);
    } else {
      clockOut.mutate();
    }
  };

  const tillIsOpen = activeTillSession && activeTillSession.status === 'open';
  const isContextLoading = shiftLoading || tillLoading;

  // Show loading state while contexts are loading
  if (isContextLoading && open) {
    return (
      <GlassModal
        open={open}
        onOpenChange={onOpenChange}
        title="Clock Out"
        description="Loading shift data..."
        size="md"
        variant="default"
      >
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading shift data...</span>
        </div>
      </GlassModal>
    );
  }

  // No active shift warning (only show after loading completes)
  if (!shiftId && open && !isContextLoading) {
    return (
      <GlassModal
        open={open}
        onOpenChange={onOpenChange}
        title="Clock Out"
        description="No active shift found"
        size="md"
        variant="default"
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have an active shift to close. Please clock in first.
          </AlertDescription>
        </Alert>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </GlassModal>
    );
  }

  // PIN Authorization Screen (shown first)
  if (!pinAuthorized) {
    return (
      <GlassModal
        open={open}
        onOpenChange={onOpenChange}
        title="Manager Authorization Required"
        description="Enter manager/admin PIN to authorize clock out"
        size="md"
        variant="default"
      >
        <div className="space-y-6">
          {/* PIN Display */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Only managers or admins can authorize employee clock out
            </p>
          </div>

          {/* PIN Dots Display */}
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  i < managerPin.length
                    ? 'bg-primary border-primary scale-110'
                    : 'border-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Touch Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                className="h-16 text-2xl font-semibold hover:bg-primary/10 active:scale-95 transition-transform"
                onClick={() => handlePinDigit(String(num))}
                disabled={isValidatingPin}
              >
                {num}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              className="h-16 text-lg text-muted-foreground hover:text-foreground"
              onClick={handlePinClear}
              disabled={isValidatingPin}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-16 text-2xl font-semibold hover:bg-primary/10 active:scale-95 transition-transform"
              onClick={() => handlePinDigit('0')}
              disabled={isValidatingPin}
            >
              0
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-16 hover:text-foreground"
              onClick={handlePinBackspace}
              disabled={isValidatingPin}
            >
              <Delete className="w-6 h-6" />
            </Button>
          </div>

          {/* Authorize Button */}
          <Button
            onClick={handlePinSubmit}
            className="w-full h-14 text-lg font-semibold"
            disabled={isValidatingPin || managerPin.length !== 6}
          >
            {isValidatingPin ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5 mr-2" />
                Authorize Clock Out
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
            disabled={isValidatingPin}
          >
            Cancel
          </Button>
        </div>
      </GlassModal>
    );
  }

  // Clock Out Form (shown after PIN authorization)
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
          {/* Authorization Badge */}
          <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-400">
              Authorized by manager
            </span>
          </div>

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
