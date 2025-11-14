// @ts-nocheck - Types will auto-regenerate after purchase_orders migration
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBranch } from '@/contexts/BranchContext';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface PurchaseOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder?: any;
  onSuccess: () => void;
}

interface LineItem {
  inventory_item_id: string;
  quantity: number;
  unit_cost: number;
  notes?: string;
}

export function PurchaseOrderModal({ open, onOpenChange, purchaseOrder, onSuccess }: PurchaseOrderModalProps) {
  const { toast } = useToast();
  const { currentBranch } = useBranch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_delivery: '',
    notes: '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { inventory_item_id: '', quantity: 1, unit_cost: 0 }
  ]);

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      // @ts-ignore - Types will update after migration
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .eq('active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentBranch?.id,
  });

  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory_items', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch?.id) return [];
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('branch_id', currentBranch.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentBranch?.id,
  });

  useEffect(() => {
    if (purchaseOrder) {
      setFormData({
        supplier_id: purchaseOrder.supplier_id || '',
        expected_delivery: purchaseOrder.expected_delivery ? new Date(purchaseOrder.expected_delivery).toISOString().split('T')[0] : '',
        notes: purchaseOrder.notes || '',
      });
      
      if (purchaseOrder.purchase_order_items && purchaseOrder.purchase_order_items.length > 0) {
        setLineItems(purchaseOrder.purchase_order_items.map((item: any) => ({
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          notes: item.notes,
        })));
      }
    } else {
      setFormData({
        supplier_id: '',
        expected_delivery: '',
        notes: '',
      });
      setLineItems([{ inventory_item_id: '', quantity: 1, unit_cost: 0 }]);
    }
  }, [purchaseOrder, open]);

  const addLineItem = () => {
    setLineItems([...lineItems, { inventory_item_id: '', quantity: 1, unit_cost: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
  };

  const generateOrderNumber = async () => {
    // @ts-ignore - Types will update after migration
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('order_number')
      .eq('branch_id', currentBranch?.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) return `PO-${Date.now()}`;
    
    if (!data || data.length === 0) {
      return `PO-${new Date().getFullYear()}-001`;
    }

    const lastNumber = data[0].order_number.split('-')[2];
    const nextNumber = String(parseInt(lastNumber) + 1).padStart(3, '0');
    return `PO-${new Date().getFullYear()}-${nextNumber}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!currentBranch?.id) {
        throw new Error('No branch selected');
      }

      if (!formData.supplier_id) {
        throw new Error('Please select a supplier');
      }

      const validLineItems = lineItems.filter(item => 
        item.inventory_item_id && item.quantity > 0 && item.unit_cost > 0
      );

      if (validLineItems.length === 0) {
        throw new Error('Please add at least one valid line item');
      }

      const totalAmount = calculateTotal();

      if (purchaseOrder) {
        // Update existing PO
        // @ts-ignore - Types will update after migration
        const { error: updateError } = await supabase
          .from('purchase_orders')
          .update({
            supplier_id: formData.supplier_id,
            expected_delivery: formData.expected_delivery || null,
            notes: formData.notes,
            total_amount: totalAmount,
          })
          .eq('id', purchaseOrder.id);

        if (updateError) throw updateError;

        // Delete existing line items
        // @ts-ignore - Types will update after migration
        await supabase
          .from('purchase_order_items')
          .delete()
          .eq('purchase_order_id', purchaseOrder.id);

        // Insert new line items
        const itemsToInsert = validLineItems.map(item => ({
          purchase_order_id: purchaseOrder.id,
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total_cost: item.quantity * item.unit_cost,
          notes: item.notes,
        }));

        // @ts-ignore - Types will update after migration
        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      } else {
        // Create new PO
        const orderNumber = await generateOrderNumber();

        // @ts-ignore - Types will update after migration
        const { data: newPO, error: insertError } = await supabase
          .from('purchase_orders')
          .insert({
            branch_id: currentBranch.id,
            supplier_id: formData.supplier_id,
            order_number: orderNumber,
            status: 'draft',
            total_amount: totalAmount,
            expected_delivery: formData.expected_delivery || null,
            notes: formData.notes,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Insert line items
        const itemsToInsert = validLineItems.map(item => ({
          purchase_order_id: newPO.id,
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total_cost: item.quantity * item.unit_cost,
          notes: item.notes,
        }));

        // @ts-ignore - Types will update after migration
        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast({
        title: purchaseOrder ? 'Purchase Order Updated' : 'Purchase Order Created',
        description: `PO has been saved successfully`,
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
      title={`${purchaseOrder ? 'View/Edit' : 'Create'} Purchase Order`}
      size="xl"
      variant="default"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="supplier">Supplier *</Label>
            <Select 
              value={formData.supplier_id} 
              onValueChange={(val) => setFormData({ ...formData, supplier_id: val })}
              disabled={!!purchaseOrder}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="expected_delivery">Expected Delivery</Label>
            <Input
              id="expected_delivery"
              type="date"
              value={formData.expected_delivery}
              onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
              disabled={purchaseOrder?.status === 'received'}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            disabled={purchaseOrder?.status === 'received'}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Line Items *</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addLineItem}
              disabled={purchaseOrder?.status === 'received'}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {lineItems.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <Label className="text-xs">Item</Label>
                    <Select 
                      value={item.inventory_item_id} 
                      onValueChange={(val) => updateLineItem(index, 'inventory_item_id', val)}
                      disabled={purchaseOrder?.status === 'received'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems?.map((invItem) => (
                          <SelectItem key={invItem.id} value={invItem.id}>
                            {invItem.name} ({invItem.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      disabled={purchaseOrder?.status === 'received'}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Unit Cost</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_cost}
                      onChange={(e) => updateLineItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                      disabled={purchaseOrder?.status === 'received'}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Total</Label>
                    <Input
                      value={`$${(item.quantity * item.unit_cost).toFixed(2)}`}
                      disabled
                    />
                  </div>

                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1 || purchaseOrder?.status === 'received'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-3xl font-bold">${calculateTotal().toFixed(2)}</p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {purchaseOrder?.status !== 'received' && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {purchaseOrder ? 'Update' : 'Create'} PO
              </Button>
            )}
          </div>
        </div>
      </form>
    </GlassModal>
  );
}
