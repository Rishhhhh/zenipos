import { useState } from 'react';
import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface ModifyOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
}

export function ModifyOrderModal({ 
  open, 
  onOpenChange,
  orderId,
  orderNumber 
}: ModifyOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<Array<{
    menu_item_id: string;
    name: string;
    price: number;
    quantity: number;
  }>>([]);

  // Fetch menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items-modify'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, price, in_stock')
        .eq('in_stock', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch current order items
  const { data: currentItems = [] } = useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id,
          menu_item_id,
          quantity,
          unit_price,
          notes,
          modifiers,
          menu_items(name)
        `)
        .eq('order_id', orderId);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const addItems = useMutation({
    mutationFn: async () => {
      if (selectedItems.length === 0) {
        throw new Error('No items selected');
      }

      const itemsToAdd = selectedItems.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        notes: null,
        modifiers: []
      }));

      const { error } = await supabase.rpc('add_items_to_order', {
        order_id_param: orderId,
        new_items: itemsToAdd
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Items Added',
        description: `${selectedItems.length} item(s) added to order`,
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-items'] });
      queryClient.invalidateQueries({ queryKey: ['kds-orders'] });
      setSelectedItems([]);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Add Items',
        description: error.message,
      });
    },
  });

  const voidItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.rpc('void_order_item', {
        order_item_id_param: itemId,
        reason_param: 'Modified by staff',
        requires_approval_param: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Item Voided',
        description: 'Item removed from order',
      });
      queryClient.invalidateQueries({ queryKey: ['order-items'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const addToSelection = (menuItem: any) => {
    const existing = selectedItems.find(item => item.menu_item_id === menuItem.id);
    if (existing) {
      setSelectedItems(selectedItems.map(item =>
        item.menu_item_id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setSelectedItems(selectedItems.filter(item => item.menu_item_id !== menuItemId));
    } else {
      setSelectedItems(selectedItems.map(item =>
        item.menu_item_id === menuItemId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title="Modify Order"
      description={`Add or remove items from order #${orderNumber}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Current Items */}
        <div>
          <h3 className="font-semibold mb-2">Current Items</h3>
          <ScrollArea className="h-32 border rounded-lg">
            <div className="p-3 space-y-2">
              {currentItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-1">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.menu_items?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × RM {item.unit_price.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => voidItem.mutate(item.id)}
                    disabled={voidItem.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {currentItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items in order
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Add New Items */}
        <div>
          <h3 className="font-semibold mb-2">Add Items</h3>
          <ScrollArea className="h-48 border rounded-lg">
            <div className="grid grid-cols-2 gap-2 p-3">
              {menuItems.map((item: any) => (
                <Button
                  key={item.id}
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-start"
                  onClick={() => addToSelection(item)}
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    RM {item.price.toFixed(2)}
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Selected Items to Add */}
        {selectedItems.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Items to Add</h3>
            <div className="space-y-2 p-3 bg-accent/50 rounded-lg">
              {selectedItems.map((item) => (
                <div key={item.menu_item_id} className="flex items-center justify-between">
                  <span className="text-sm">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.menu_item_id, parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                      min="1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                    >
                      +
                    </Button>
                    <span className="text-sm font-medium min-w-[60px] text-right">
                      RM {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedItems([]);
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => addItems.mutate()}
            disabled={addItems.isPending || selectedItems.length === 0}
            className="flex-1"
          >
            {addItems.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Plus className="h-4 w-4 mr-2" />
            Add {selectedItems.length} Item(s)
          </Button>
        </div>
      </div>
    </GlassModal>
  );
}
