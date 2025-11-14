import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBranch } from '@/contexts/BranchContext';
import { Loader2 } from 'lucide-react';

interface InventoryItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: any;
  onSuccess: () => void;
}

export function InventoryItemModal({ open, onOpenChange, item, onSuccess }: InventoryItemModalProps) {
  const { toast } = useToast();
  const { currentBranch } = useBranch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unit: 'kg',
    current_qty: 0,
    reorder_point: 0,
    reorder_qty: 0,
    cost_per_unit: 0,
    category: 'dry_goods',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        sku: item.sku || '',
        unit: item.unit || 'kg',
        current_qty: item.current_qty || 0,
        reorder_point: item.reorder_point || 0,
        reorder_qty: item.reorder_qty || 0,
        cost_per_unit: item.cost_per_unit || 0,
        category: item.category || 'dry_goods',
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        unit: 'kg',
        current_qty: 0,
        reorder_point: 0,
        reorder_qty: 0,
        cost_per_unit: 0,
        category: 'dry_goods',
      });
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (item) {
        const { error } = await supabase
          .from('inventory_items')
          .update(formData)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        if (!currentBranch?.id) {
          throw new Error('No branch selected');
        }
        const { error } = await supabase
          .from('inventory_items')
          .insert({ ...formData, branch_id: currentBranch.id });
        if (error) throw error;
      }

      toast({
        title: item ? 'Item Updated' : 'Item Created',
        description: `${formData.name} has been saved successfully`,
      });

      onSuccess();
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

  return (
    <GlassModal 
      open={open} 
      onOpenChange={onOpenChange}
      title={`${item ? 'Edit' : 'Add'} Inventory Item`}
      size="md"
      variant="default"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Item Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select value={formData.unit} onValueChange={(val) => setFormData({ ...formData, unit: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilogram (kg)</SelectItem>
                <SelectItem value="g">Gram (g)</SelectItem>
                <SelectItem value="l">Liter (l)</SelectItem>
                <SelectItem value="ml">Milliliter (ml)</SelectItem>
                <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                <SelectItem value="box">Box</SelectItem>
                <SelectItem value="pack">Pack</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="current_qty">Current Stock</Label>
            <Input
              id="current_qty"
              type="number"
              step="0.001"
              value={formData.current_qty}
              onChange={(e) => setFormData({ ...formData, current_qty: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="reorder_point">Reorder Point</Label>
            <Input
              id="reorder_point"
              type="number"
              step="0.001"
              value={formData.reorder_point}
              onChange={(e) => setFormData({ ...formData, reorder_point: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="reorder_qty">Reorder Qty</Label>
            <Input
              id="reorder_qty"
              type="number"
              step="0.001"
              value={formData.reorder_qty}
              onChange={(e) => setFormData({ ...formData, reorder_qty: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cost">Cost per Unit (RM)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={formData.cost_per_unit}
              onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vegetables">Vegetables</SelectItem>
                <SelectItem value="meat">Meat</SelectItem>
                <SelectItem value="dairy">Dairy</SelectItem>
                <SelectItem value="dry_goods">Dry Goods</SelectItem>
                <SelectItem value="beverages">Beverages</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {item ? 'Update Item' : 'Create Item'}
        </Button>
      </form>
    </GlassModal>
  );
}
