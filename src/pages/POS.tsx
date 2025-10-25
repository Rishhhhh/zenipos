import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useCartStore } from "@/lib/store/cart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { usePromotions } from "@/lib/hooks/usePromotions";

// Import extracted components
import { CategoryList } from "@/components/pos/CategoryList";
import { ItemGrid } from "@/components/pos/ItemGrid";
import { CartSummary } from "@/components/pos/CartSummary";

export default function POS() {
  const { items, addItem, updateQuantity, clearCart, getSubtotal, getTax, getTotal, getDiscount, appliedPromotions, sessionId } = useCartStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  
  // Auto-evaluate promotions
  usePromotions();

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
      const discount = getDiscount();
      const total = getTotal();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          session_id: sessionId,
          subtotal,
          tax,
          discount,
          total,
          applied_promotions: appliedPromotions.map(p => ({
            id: p.promotion.id,
            name: p.promotion.name,
            discount: p.discount,
          })),
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
        <ResizablePanel defaultSize={20} minSize={15}>
          <CategoryList
            categories={categories}
            isLoading={categoriesLoading}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={30}>
          <ItemGrid
            items={menuItems}
            isLoading={itemsLoading}
            onAddItem={addItem}
            categoryId={selectedCategoryId}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={30} minSize={25}>
          <CartSummary
            items={items}
            subtotal={getSubtotal()}
            tax={getTax()}
            total={getTotal()}
            discount={getDiscount()}
            appliedPromotions={appliedPromotions}
            onUpdateQuantity={updateQuantity}
            onSendToKDS={() => sendToKDS.mutate()}
            isSending={sendToKDS.isPending}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
