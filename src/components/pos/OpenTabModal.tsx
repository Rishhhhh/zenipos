import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { terminalManager } from '@/lib/payments/CardTerminal';
import { Loader2 } from 'lucide-react';

interface OpenTabModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpenTabModal({ open, onOpenChange }: OpenTabModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [tableId, setTableId] = useState('');
  const [preAuthAmount, setPreAuthAmount] = useState('200');
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: tables } = useQuery({
    queryKey: ['tables-available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('status', 'available')
        .order('label');
      if (error) throw error;
      return data;
    },
  });

  const createTab = useMutation({
    mutationFn: async () => {
      if (!customerName || !tableId || !preAuthAmount) {
        throw new Error('Please fill in all required fields');
      }
      const amount = parseFloat(preAuthAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid pre-authorization amount');
      }
      setProcessing(true);
      const terminal = terminalManager.getActiveTerminal();
      if (!terminal) {
        throw new Error('No card terminal available');
      }
      const preAuthResult = await terminal.preAuthorize(amount, `tab_${Date.now()}`);
      if (!preAuthResult.success) {
        throw new Error(preAuthResult.error || 'Pre-authorization failed');
      }
      const { data: tab, error: tabError } = await supabase
        .from('open_tabs')
        .insert({
          table_id: tableId,
          customer_name: customerName,
          pre_auth_amount: amount,
          pre_auth_ref: preAuthResult.preAuthRef,
          card_last_4: preAuthResult.cardLast4,
          current_balance: 0,
          status: 'open',
        })
        .select()
        .single();
      if (tabError) throw tabError;
      await supabase.from('tables').update({ status: 'occupied' }).eq('id', tableId);
      return tab;
    },
    onSuccess: () => {
      toast.success('Tab opened successfully');
      queryClient.invalidateQueries({ queryKey: ['open-tabs'] });
      queryClient.invalidateQueries({ queryKey: ['tables-available'] });
      setCustomerName('');
      setTableId('');
      setPreAuthAmount('200');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to open tab');
    },
    onSettled: () => setProcessing(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Open Tab</DialogTitle>
          <DialogDescription>Pre-authorize a customer's card to open a tab</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Customer Name</Label>
            <Input id="customer-name" placeholder="Enter customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={processing} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table">Table</Label>
            <Select value={tableId} onValueChange={setTableId} disabled={processing}>
              <SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger>
              <SelectContent>{tables?.map((table) => <SelectItem key={table.id} value={table.id}>{table.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Pre-Authorization Amount</Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPreAuthAmount('100')} disabled={processing}>RM 100</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPreAuthAmount('150')} disabled={processing}>RM 150</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPreAuthAmount('200')} disabled={processing}>RM 200</Button>
            </div>
            <Input id="amount" type="number" placeholder="Or enter custom amount" value={preAuthAmount} onChange={(e) => setPreAuthAmount(e.target.value)} disabled={processing} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>Cancel</Button>
          <Button onClick={() => createTab.mutate()} disabled={processing || !customerName || !tableId || !preAuthAmount}>
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {processing ? 'Processing...' : 'Open Tab'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
