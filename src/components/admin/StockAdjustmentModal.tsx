import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBranch } from '@/contexts/BranchContext';
import { Loader2 } from 'lucide-react';

interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: any;
  onSuccess: () => void;
}

export function StockAdjustmentModal({ open, onOpenChange, item, onSuccess }: StockAdjustmentModalProps) {
  const { toast } = useToast();
  const { currentBranch } = useBranch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'purchase' | 'adjustment' | 'wastage'>('purchase');
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('');
  const [wastageReason, setWastageReason] = useState('expired');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const finalQty = adjustmentType === 'wastage' ? -Math.abs(quantity) : quantity;
      const newQty = Math.max(0, item.current_qty + finalQty);
      
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ current_qty: newQty, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (updateError) throw updateError;

      const { error: moveError } = await supabase
        .from('stock_moves')
        .insert({
          inventory_item_id: item.id,
          branch_id: currentBranch?.id,
          type: adjustmentType,
          quantity: finalQty,
          reason: reason || `${adjustmentType} by ${user.email}`,
          performed_by: user.id,
          cost_impact: adjustmentType === 'purchase' ? quantity * item.cost_per_unit : 0,
        });

      if (moveError) throw moveError;

      if (adjustmentType === 'wastage') {
        await supabase.from('wastage_logs').insert({
          inventory_item_id: item.id,
          branch_id: currentBranch?.id,
          quantity: Math.abs(quantity),
          reason: wastageReason,
          notes: reason,
          logged_by: user.id,
          cost_impact: Math.abs(quantity) * item.cost_per_unit,
        });
      }

      await supabase.from('audit_log').insert({
        actor: user.id,
        action: 'inventory_adjustment',
        entity: 'inventory_items',
        entity_id: item.id,
        diff: {
          old_qty: item.current_qty,
          new_qty: newQty,
          adjustment: finalQty,
          type: adjustmentType,
        },
      });

      toast({
        title: 'Stock Adjusted',
        description: `${item.name} quantity updated to ${newQty} ${item.unit}`,
      });

      onSuccess();
      onOpenChange(false);
      
      setQuantity(0);
      setReason('');
      setAdjustmentType('purchase');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <GlassModal 
      open={open} 
      onOpenChange={onOpenChange}
      title={`Adjust Stock: ${item.name}`}
      size="md"
      variant="default"
    >
      <div className="bg-muted p-4 rounded-lg mb-4">
        <p className="text-sm text-muted-foreground">Current Stock</p>
        <p className="text-2xl font-bold">{item.current_qty} {item.unit}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="type">Adjustment Type</Label>
          <Select value={adjustmentType} onValueChange={(val: any) => setAdjustmentType(val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="purchase">Purchase/Receiving (+)</SelectItem>
              <SelectItem value="adjustment">Manual Adjustment</SelectItem>
              <SelectItem value="wastage">Wastage/Loss (-)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="quantity">Quantity ({item.unit})</Label>
          <Input
            id="quantity"
            type="number"
            step="0.001"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            required
            placeholder={adjustmentType === 'wastage' ? 'Enter positive number' : 'Enter quantity'}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {adjustmentType === 'wastage' 
              ? 'Will be deducted from stock' 
              : adjustmentType === 'purchase'
              ? 'Will be added to stock'
              : 'Use negative for decrease, positive for increase'}
          </p>
        </div>

        {adjustmentType === 'wastage' && (
          <div>
            <Label htmlFor="wastageReason">Wastage Reason</Label>
            <Select value={wastageReason} onValueChange={setWastageReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="spoiled">Spoiled</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="reason">Notes</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional notes about this adjustment"
            rows={3}
          />
        </div>

        <div className="bg-primary/10 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">New Stock Level</p>
          <p className="text-xl font-bold">
            {Math.max(0, item.current_qty + (adjustmentType === 'wastage' ? -Math.abs(quantity) : quantity)).toFixed(3)} {item.unit}
          </p>
        </div>

        <Button type="submit" disabled={isSubmitting || quantity === 0} className="w-full">
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Apply Adjustment
        </Button>
      </form>
    </GlassModal>
  );
}
