import { useState } from 'react';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OpenTillModal } from './OpenTillModal';
import { useTillSession } from '@/contexts/TillSessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';

interface EmployeeClockInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (employee: any, shiftId: string) => void;
}

export function EmployeeClockInModal({ open, onOpenChange, onSuccess }: EmployeeClockInModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openTillSession } = useTillSession();
  const { organization } = useAuth();
  const { currentBranch } = useBranch();
  const [pin, setPin] = useState('');
  const [showOpenTill, setShowOpenTill] = useState(false);
  const [clockedInData, setClockedInData] = useState<{ employee: any; shift: any } | null>(null);

  const clockIn = useMutation({
    mutationFn: async (enteredPin: string) => {
      if (!organization?.id) {
        throw new Error('Organization context not available');
      }

      // Validate PIN via new edge function with proper parameters
      const { data: pinData, error: pinError } = await supabase.functions.invoke('validate-employee-clock-in', {
        body: { 
          pin: enteredPin,
          organizationId: organization.id,
          branchId: currentBranch?.id
        },
      });

      if (pinError || !pinData?.valid) {
        throw new Error(pinData?.error || 'Invalid PIN');
      }

      const employee = pinData.employee;

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
          status: 'active',
          clock_in_location: location,
        })
        .select()
        .single();

      if (shiftError) throw shiftError;

      return { employee, shift };
    },
    onSuccess: ({ employee, shift }) => {
      // Don't show success toast yet - wait for till open
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
    if (pin.length >= 4) {
      clockIn.mutate(pin);
    }
  };

  const handleTillOpened = (tillSessionId: string) => {
    if (clockedInData) {
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="pin">Employee PIN</Label>
          <Input
            id="pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            placeholder="Enter 6-digit PIN"
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
              onClick={() => setPin(pin.length < 6 ? pin + num : pin)}
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
            onClick={() => setPin(pin.length < 6 ? pin + '0' : pin)}
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

        <Button type="submit" className="w-full" disabled={clockIn.isPending || pin.length !== 6}>
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
