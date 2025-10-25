import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';

interface ManagerPinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (managerId: string) => void;
  action: string;
}

export function ManagerPinModal({ open, onOpenChange, onSuccess, action }: ManagerPinModalProps) {
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;

    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-manager-pin', {
        body: { pin },
      });

      if (error || !data?.valid) {
        throw new Error('Invalid manager PIN');
      }

      const employee = data.employee;
      
      // Check if employee has manager or admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('employee_id', employee.id);

      const hasManagerRole = roles?.some(r => r.role === 'manager' || r.role === 'admin');
      
      if (!hasManagerRole) {
        throw new Error('Employee does not have manager permissions');
      }

      toast({
        title: 'Authorized',
        description: `${action} authorized by ${employee.name}`,
      });

      onSuccess(employee.id);
      setPin('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authorization Failed',
        description: error.message,
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manager Authorization Required</DialogTitle>
        </DialogHeader>

        <div className="text-center mb-4">
          <ShieldCheck className="h-12 w-12 mx-auto text-warning mb-2" />
          <p className="text-sm text-muted-foreground">{action}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Manager PIN</label>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter manager PIN"
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

          <Button type="submit" className="w-full" size="lg" disabled={pin.length < 4 || isValidating}>
            {isValidating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            Authorize
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
