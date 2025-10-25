import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/lib/store/cart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, Send } from "lucide-react";

export default function POS() {
  const { items, addItem, updateQuantity, removeItem, clearCart, getSubtotal, getTax, getTotal, sessionId } = useCartStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch menu items
  const { data: menuItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['menu_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('in_stock', true);
      if (error) throw error;
      return data;
    },
  });

  // Send to KDS mutation
  const sendToKDS = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const subtotal = getSubtotal();
      const tax = getTax();
      const total = getTotal();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          session_id: sessionId,
          subtotal,
          tax,
          total,
          created_by: user.id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          items.map(item => ({
            order_id: order.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            unit_price: item.price,
            notes: item.notes,
            modifiers: item.modifiers || [],
          }))
        );

      if (itemsError) throw itemsError;

      // Log to audit
      await supabase.from('audit_log').insert({
        actor: user.id,
        action: 'create_order',
        entity: 'orders',
        entity_id: order.id,
        diff: { items: items.length, total },
      });

      return order;
    },
    onSuccess: () => {
      toast({
        title: "Order sent to KDS",
        description: `${items.length} items sent to kitchen`,
      });
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to send order",
        description: error.message,
      });
    },
  });

  return (
    <div className="kiosk-layout">
      <ResizablePanelGroup direction="horizontal">
        {/* Category List */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="h-full bg-secondary/30 p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Categories</h2>
            {categoriesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {categories?.map(cat => (
                  <Button
                    key={cat.id}
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Item Grid */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Menu Items</h2>
            {itemsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {menuItems?.map(item => (
                  <Card
                    key={item.id}
                    className="p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => addItem({
                      menu_item_id: item.id,
                      name: item.name,
                      price: Number(item.price),
                    })}
                  >
                    <h3 className="font-medium text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.sku}</p>
                    <p className="text-lg font-semibold text-primary mt-2">
                      ${Number(item.price).toFixed(2)}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Cart Summary */}
        <ResizablePanel defaultSize={30} minSize={25}>
          <div className="h-full bg-card p-4 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Cart</h2>
            
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {items.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Cart is empty</p>
              ) : (
                items.map(item => (
                  <Card key={item.id} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (8%)</span>
                <span className="font-medium">${getTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
              
              <Button
                className="w-full mt-4"
                size="lg"
                onClick={() => sendToKDS.mutate()}
                disabled={items.length === 0 || sendToKDS.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Send to KDS
              </Button>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
