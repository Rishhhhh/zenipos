import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, LogIn } from 'lucide-react';

interface EmployeeClockInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (employee: any, shiftId: string) => void;
}

export function EmployeeClockInModal({ open, onOpenChange, onSuccess }: EmployeeClockInModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pin, setPin] = useState('');

  const clockIn = useMutation({
    mutationFn: async (enteredPin: string) => {
      // Validate PIN via edge function
      const { data: pinData, error: pinError } = await supabase.functions.invoke('validate-manager-pin', {
        body: { pin: enteredPin },
      });

      if (pinError || !pinData?.valid) {
        throw new Error('Invalid PIN');
      }

      const employee = pinData.employee;

      // Check for active shift
      const { data: activeShift } = await supabase.rpc('get_active_shift', {
        employee_id_param: employee.id,
      });

      if (activeShift) {
        throw new Error('Employee already has an active shift');
      }

      // Create shift
      const { data: { user } } = await supabase.auth.getUser();
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .insert({
          employee_id: employee.id,
          user_id: user?.id || null,
          status: 'active',
        })
        .select()
        .single();

      if (shiftError) throw shiftError;

      return { employee, shift };
    },
    onSuccess: ({ employee, shift }) => {
      toast({
        title: 'Clocked In',
        description: `Welcome, ${employee.name}!`,
      });
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      onSuccess(employee, shift.id);
      setPin('');
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clock In</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Enter Your PIN</label>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="6-digit PIN"
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                className="h-16 text-xl"
                onClick={() => {
                  if (key === 'C') {
                    setPin('');
                  } else if (key === '⌫') {
                    setPin(pin.slice(0, -1));
                  } else {
                    if (pin.length < 6) {
                      setPin(pin + key);
                    }
                  }
                }}
              >
                {key}
              </Button>
            ))}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={pin.length < 4 || clockIn.isPending}>
            {clockIn.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4 mr-2" />
            )}
            Clock In
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
