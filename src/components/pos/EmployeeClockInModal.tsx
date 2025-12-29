import { useState } from 'react';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OpenTillModal } from './OpenTillModal';
import { useTillSession } from '@/contexts/TillSessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useShift } from '@/contexts/ShiftContext';

interface EmployeeClockInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (employee?: any, shiftId?: string) => void;
}

export function EmployeeClockInModal({ open, onOpenChange, onSuccess }: EmployeeClockInModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openTillSession } = useTillSession();
  const { organization } = useAuth();
  const { currentBranch } = useBranch();
  const { activeShift, refreshShift, setActiveShift } = useShift();
  const [pin, setPin] = useState('');
  const [showOpenTill, setShowOpenTill] = useState(false);
  const [clockedInData, setClockedInData] = useState<{ employee: any; shift: any } | null>(null);
  const [existingShiftError, setExistingShiftError] = useState<string | null>(null);

  const clockIn = useMutation({
    mutationFn: async (enteredPin: string) => {
      if (!organization?.id) {
        throw new Error('Organization context not available');
      }

      // Validate PIN via edge function
      const { data: pinData, error: pinError } = await supabase.functions.invoke('validate-employee-clock-in', {
        body: { 
          pin: enteredPin,
          organizationId: organization.id,
          branchId: currentBranch?.id
        },
      });

      // Edge function now returns 200 with error details in body
      if (pinError) {
        throw new Error(pinData?.error || pinError.message || 'Invalid PIN');
      }

      if (!pinData?.valid) {
        throw new Error(pinData?.error || 'Invalid PIN');
      }

      const employee = pinData.employee;

      // CRITICAL: Check for existing active shift BEFORE creating a new one
      const { data: existingShiftData } = await supabase.rpc('get_active_shift', {
        employee_id_param: employee.id
      });

      if (existingShiftData && existingShiftData.length > 0) {
        const existingShift = existingShiftData[0];
        console.log('[ClockIn] Found existing active shift:', existingShift.shift_id);
        
        // Return existing shift instead of creating duplicate
        return { 
          employee, 
          shift: { id: existingShift.shift_id, ...existingShift },
          isExisting: true 
        };
      }

      // Get geolocation if available
      let location = null;
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = `${position.coords.latitude},${position.coords.longitude}`;
        } catch (e) {
          console.warn('Geolocation not available');
        }
      }

      // Create shift with clock-in metadata
      const { data: { user } } = await supabase.auth.getUser();
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .insert({
          employee_id: employee.id,
          user_id: user?.id || null,
          organization_id: employee.organization_id,
          branch_id: currentBranch?.id || null,
          status: 'active',
          clock_in_location: location,
        })
        .select()
        .single();

      if (shiftError) throw shiftError;

      return { employee, shift, isExisting: false };
    },
    onSuccess: ({ employee, shift, isExisting }) => {
      if (isExisting) {
        // Already clocked in - update context and show message
        // RPC returns: shift_id, clock_in_at, branch_id, status, till_session_id
        const shiftData = shift as { shift_id?: string; id?: string; clock_in_at: string; branch_id: string; status: string; till_session_id?: string };
        const resolvedShiftId = shiftData.shift_id || shiftData.id || '';
        
        setActiveShift({
          id: resolvedShiftId,
          clockInAt: new Date(shiftData.clock_in_at),
          branchId: shiftData.branch_id,
          status: shiftData.status || 'active',
          tillSessionId: shiftData.till_session_id || null,
          employeeId: employee.id,
          employeeName: employee.name,
        });
        
        toast({
          title: 'Already Clocked In',
          description: `Welcome back, ${employee.name}! Your shift is still active.`,
        });
        
        setPin('');
        onSuccess(employee, resolvedShiftId);
        onOpenChange(false);
        return;
      }

      // New shift - proceed to till opening
      setClockedInData({ employee, shift });
      setShowOpenTill(true);
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Clock In Failed',
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setExistingShiftError(null);
    if (pin.length >= 4) {
      clockIn.mutate(pin);
    }
  };

  const handleTillOpened = async (tillSessionId: string) => {
    if (clockedInData) {
      // Update ShiftContext with new shift
      setActiveShift({
        id: clockedInData.shift.id,
        clockInAt: new Date(clockedInData.shift.clock_in_at),
        branchId: clockedInData.shift.branch_id,
        status: 'active',
        tillSessionId: tillSessionId,
        employeeId: clockedInData.employee.id,
        employeeName: clockedInData.employee.name,
      });

      toast({
        title: 'Clocked In & Till Opened',
        description: `Welcome, ${clockedInData.employee.name}!`,
      });
      
      onSuccess(clockedInData.employee, clockedInData.shift.id);
      setPin('');
      setClockedInData(null);
      setShowOpenTill(false);
      onOpenChange(false);
    }
  };

  // If already clocked in via context, show alert
  const alreadyClockedIn = activeShift && !showOpenTill;

  return (
    <>
      <GlassModal
        open={open && !showOpenTill}
        onOpenChange={onOpenChange}
        title="Clock In"
        description="Enter your employee PIN to start your shift"
        size="md"
        variant="default"
      >
        {alreadyClockedIn && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You already have an active shift. Clock out first if you want to start a new shift.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pin">Employee PIN</Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              maxLength={5}
              placeholder="Enter 5-digit PIN"
              disabled={clockIn.isPending}
              autoFocus
            />
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                onClick={() => setPin(pin.length < 5 ? pin + num : pin)}
                disabled={clockIn.isPending}
              >
                {num}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setPin(pin.slice(0, -1))}
              disabled={clockIn.isPending}
            >
              ←
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPin(pin.length < 5 ? pin + '0' : pin)}
              disabled={clockIn.isPending}
            >
              0
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPin('')}
              disabled={clockIn.isPending}
            >
              Clear
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={clockIn.isPending || pin.length !== 5}>
            {clockIn.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Clock In
          </Button>
        </form>
      </GlassModal>

      {clockedInData && (
        <OpenTillModal
          open={showOpenTill}
          onOpenChange={setShowOpenTill}
          employeeName={clockedInData.employee.name}
          employeeId={clockedInData.employee.id}
          shiftId={clockedInData.shift.id}
          onSuccess={handleTillOpened}
          onOpenTill={openTillSession}
        />
      )}
    </>
  );
}
