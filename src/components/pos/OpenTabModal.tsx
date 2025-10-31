import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, User } from 'lucide-react';

interface OpenTabModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId?: string;
  orderId?: string;
  orderTotal: number;
}

export function OpenTabModal({
  open,
  onOpenChange,
  tableId,
  orderId,
  orderTotal,
}: OpenTabModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [preAuthAmount, setPreAuthAmount] = useState(orderTotal.toString());
  const [cardLast4, setCardLast4] = useState('');
  const queryClient = useQueryClient();

  const openTabMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!employee) throw new Error('Employee not found');

      // In a real implementation, this would integrate with a payment processor
      // to pre-authorize the card
      const preAuthRef = `AUTH-${Date.now()}`;

      const { data, error } = await supabase
        .from('open_tabs')
        .insert({
          table_id: tableId,
          order_id: orderId,
          customer_name: customerName,
          pre_auth_amount: Number(preAuthAmount),
          pre_auth_ref: preAuthRef,
          card_last_4: cardLast4,
          card_brand: 'Visa', // Would come from payment processor
          current_balance: orderTotal,
          opened_by: employee.id,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Tab opened successfully');
      queryClient.invalidateQueries({ queryKey: ['open-tabs'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to open tab');
    },
  });

  const resetForm = () => {
    setCustomerName('');
    setPreAuthAmount(orderTotal.toString());
    setCardLast4('');
  };

  const handleSubmit = () => {
    if (!customerName || !cardLast4) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (cardLast4.length !== 4) {
      toast.error('Card last 4 digits must be exactly 4 numbers');
      return;
    }

    openTabMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open Tab</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="customer-name">Customer Name</Label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="pre-auth">Pre-Authorization Amount</Label>
            <Input
              id="pre-auth"
              type="number"
              value={preAuthAmount}
              onChange={(e) => setPreAuthAmount(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: 20-30% above current total
            </p>
          </div>

          <div>
            <Label htmlFor="card-last4">Card Last 4 Digits</Label>
            <Input
              id="card-last4"
              type="text"
              maxLength={4}
              value={cardLast4}
              onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
              placeholder="****"
              className="mt-2"
            />
          </div>

          <div className="bg-accent p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Current Total:</span>
              <span className="font-bold">RM {orderTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pre-Auth:</span>
              <span className="font-bold text-primary">
                RM {Number(preAuthAmount).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md text-sm">
            <p className="text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> Opening a tab will pre-authorize the card. The final charge will be processed when the tab is closed.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={openTabMutation.isPending}
              className="flex-1"
            >
              {openTabMutation.isPending ? 'Processing...' : 'Open Tab'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
