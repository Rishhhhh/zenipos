import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useBranch } from '@/contexts/BranchContext';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TransferInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: any;
}

export function TransferInventoryModal({ open, onOpenChange, item }: TransferInventoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { branches } = useBranch();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');

  const availableBranches = branches.filter(b => b.id !== item?.branch_id && b.active);
  const maxQuantity = Number(item?.current_qty || 0);

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!item || !selectedBranchId || quantity <= 0) throw new Error('Missing data');
      if (quantity > maxQuantity) throw new Error('Insufficient quantity');

      // 1. Deduct from source branch
      const { error: deductError } = await supabase
        .from('inventory_items')
        .update({ current_qty: maxQuantity - quantity })
        .eq('id', item.id);

      if (deductError) throw deductError;

      // 2. Check if item exists in target branch
      const { data: targetItem } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('name', item.name)
        .eq('branch_id', selectedBranchId)
        .single();

      if (targetItem) {
        // Add to existing item
        await supabase
          .from('inventory_items')
          .update({ current_qty: Number(targetItem.current_qty) + quantity })
          .eq('id', targetItem.id);
      } else {
        // Create new item in target branch
        await supabase.from('inventory_items').insert({
          name: item.name,
          sku: item.sku,
          unit: item.unit,
          branch_id: selectedBranchId,
          current_qty: quantity,
          reorder_point: item.reorder_point,
          cost_per_unit: item.cost_per_unit,
          supplier_id: item.supplier_id,
          category: item.category,
        });
      }

      // 3. Create stock move records
      const targetBranch = branches.find(b => b.id === selectedBranchId);
      const sourceBranch = branches.find(b => b.id === item.branch_id);

      await supabase.from('stock_moves').insert([
        {
          inventory_item_id: item.id,
          type: 'transfer',
          quantity: -quantity,
          reason: `Transfer to ${targetBranch?.name}: ${reason}`,
        },
        {
          inventory_item_id: targetItem?.id,
          type: 'transfer',
          quantity: quantity,
          reason: `Transfer from ${sourceBranch?.name}: ${reason}`,
        },
      ]);

      // 4. Audit log
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_log').insert({
        actor: user?.id,
        action: 'inventory_branch_transfer',
        entity: 'inventory_items',
        entity_id: item.id,
        diff: {
          item_name: item.name,
          quantity,
          from_branch: item.branch_id,
          from_branch_name: sourceBranch?.name,
          to_branch: selectedBranchId,
          to_branch_name: targetBranch?.name,
          reason,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Inventory Transferred',
        description: `Successfully transferred ${quantity} ${item?.unit || 'units'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-moves'] });
      onOpenChange(false);
      setSelectedBranchId('');
      setQuantity(0);
      setReason('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Transfer Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId || quantity <= 0) {
      toast({
        title: 'Missing Information',
        description: 'Please select a branch and enter a valid quantity',
        variant: 'destructive',
      });
      return;
    }
    if (quantity > maxQuantity) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${maxQuantity} ${item?.unit} available`,
        variant: 'destructive',
      });
      return;
    }
    transferMutation.mutate();
  };

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Transfer ${item?.name || 'Item'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Available: <strong>{maxQuantity} {item?.unit}</strong>
          </AlertDescription>
        </Alert>

        <div>
          <Label htmlFor="quantity">Quantity to Transfer *</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            max={maxQuantity}
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            placeholder="Enter quantity"
          />
        </div>

        <div>
          <Label htmlFor="target-branch">Target Branch *</Label>
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger id="target-branch">
              <SelectValue placeholder="Select target branch" />
            </SelectTrigger>
            <SelectContent>
              {availableBranches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name} {branch.code && `(${branch.code})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="reason">Reason for Transfer</Label>
          <Textarea
            id="reason"
            placeholder="e.g., Stock balancing, urgent need"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={transferMutation.isPending || !selectedBranchId || quantity <= 0}
        >
          {transferMutation.isPending ? (
            'Transferring...'
          ) : (
            <>
              <ArrowRight className="h-4 w-4 mr-2" />
              Transfer {quantity > 0 && `${quantity} ${item?.unit}`}
            </>
          )}
        </Button>
      </form>
    </GlassModal>
  );
}
