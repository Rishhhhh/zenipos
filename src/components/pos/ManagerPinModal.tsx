import { useState } from 'react';
import { ResponsiveModal } from '@/components/pos/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

      const hasManagerRole = roles?.some(r => r.role === 'manager' || r.role === 'owner');
      
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
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Manager Authorization"
      description={`Enter manager PIN to authorize: ${action}`}
      side="bottom"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="pin">PIN</Label>
          <Input
            id="pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={6}
            placeholder="Enter 6-digit PIN"
            disabled={isValidating}
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
              disabled={isValidating}
            >
              {num}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setPin(pin.slice(0, -1))}
            disabled={isValidating}
          >
            ← 
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPin(pin.length < 6 ? pin + '0' : pin)}
            disabled={isValidating}
          >
            0
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPin('')}
            disabled={isValidating}
          >
            Clear
          </Button>
        </div>

        <Button type="submit" className="w-full" disabled={isValidating || pin.length !== 6}>
          {isValidating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Authorize
        </Button>
      </form>
    </ResponsiveModal>
  );
}
