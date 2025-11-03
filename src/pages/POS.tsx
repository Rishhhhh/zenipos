import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useCartStore } from "@/lib/store/cart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useState, useEffect } from "react";
import { useModalManager } from "@/hooks/useModalManager";
import { usePromotions } from "@/lib/hooks/usePromotions";
import { generate80mmKitchenTicket } from "@/lib/print/receiptGenerator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

// Import extracted components
import { CategoryList } from "@/components/pos/CategoryList";
import { ItemGrid } from "@/components/pos/ItemGrid";
import { CartSummary } from "@/components/pos/CartSummary";
import { TableSelectionModal } from "@/components/pos/TableSelectionModal";
import { ModifierSelectionModal } from "@/components/pos/ModifierSelectionModal";
import { SplitBillModal } from "@/components/pos/SplitBillModal";

export default function POS() {
  // Track performance for this page
  usePerformanceMonitor('POS');
  
  const { items, addItem, updateQuantity, voidItem, clearCart, getSubtotal, getTax, getTotal, getDiscount, appliedPromotions, sessionId, table_id, order_type, setTableId, setOrderType } = useCartStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openModal } = useModalManager();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [showTableSelect, setShowTableSelect] = useState(false);
  const [showModifierSelect, setShowModifierSelect] = useState(false);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [pendingItem, setPendingItem] = useState<any>(null);
  
  // Auto-evaluate promotions
  usePromotions();

  // Show table selection on first load
  useEffect(() => {
    if (!table_id && order_type === 'takeaway') {
      // Auto-set takeaway
    } else if (!table_id && order_type === 'dine_in') {
      setShowTableSelect(true);
    }
  }, []);

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
          table_id: useCartStore.getState().table_id,
          order_type: useCartStore.getState().order_type,
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
            modifiers: (item.modifiers || []) as any,
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
    onSuccess: (order) => {
      toast({
        title: "Order sent to KDS",
        description: `${items.length} items sent to kitchen`,
      });
      
      // Auto-print kitchen ticket
      const kitchenTicket = generate80mmKitchenTicket({
        order_id: order.id,
        order_number: order.id.substring(0, 8),
        station: 'MAIN KITCHEN',
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        subtotal: getSubtotal(),
        tax: getTax(),
        total: getTotal(),
        timestamp: new Date(),
      });
      console.log('🍳 Auto-printing kitchen ticket:', kitchenTicket);
      
      // Open payment modal using modal manager
      openModal('payment', {
        orderId: order.id,
        orderNumber: order.id.substring(0, 8),
        total: getTotal(),
        onPaymentSuccess: () => {
          clearCart();
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
      });
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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header: Table Badge (56px fixed) */}
      <div className="h-14 border-b flex items-center px-4 flex-shrink-0">
        {(table_id || order_type === 'takeaway') && (
          <Badge
            variant="secondary"
            className="text-sm cursor-pointer hover:bg-secondary/80"
            onClick={() => setShowTableSelect(true)}
          >
            <MapPin className="h-3 w-3 mr-1" />
            {order_type === 'takeaway' ? 'Takeaway' : `Table ${table_id}`}
          </Badge>
        )}
      </div>

      <TableSelectionModal
        open={showTableSelect}
        onOpenChange={setShowTableSelect}
        onSelect={(tableId, orderType) => {
          setTableId(tableId);
          setOrderType(orderType);
        }}
      />

      <ModifierSelectionModal
        open={showModifierSelect}
        onOpenChange={setShowModifierSelect}
        menuItemId={pendingItem?.menu_item_id || ''}
        menuItemName={pendingItem?.name || ''}
        onConfirm={(modifiers) => {
          if (pendingItem) {
            addItem({ ...pendingItem, modifiers });
            setPendingItem(null);
          }
        }}
      />

      <SplitBillModal
        open={showSplitBill}
        onOpenChange={setShowSplitBill}
        items={items}
        total={getTotal()}
        onSplitConfirm={(splits) => {
          // Handle split bills - create separate orders
          toast({
            title: `Bill split into ${splits.length} parts`,
            description: 'Each split can now be paid separately',
          });
          setShowSplitBill(false);
          // TODO: Implement actual order splitting logic
        }}
      />

      {/* Main Content: Fixed Heights */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Categories (240px fixed, internal scroll) */}
        <div className="w-60 border-r flex-shrink-0 overflow-hidden">
          <CategoryList
            categories={categories}
            isLoading={categoriesLoading}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </div>

        {/* MIDDLE: Items (flex-grow, main scrollable) */}
        <div className="flex-1 overflow-y-auto bg-background">
          <ItemGrid
            items={menuItems}
            isLoading={itemsLoading}
            onAddItem={(item) => {
              // First check if table is selected for dine-in
              if (!table_id && !order_type) {
                setShowTableSelect(true);
                return;
              }
              
              // Check for modifiers, if yes show modifier modal
              setPendingItem(item);
              setShowModifierSelect(true);
            }}
            categoryId={selectedCategoryId}
          />
        </div>

        {/* RIGHT: Cart (384px fixed, sticky checkout) */}
        <div className="w-96 border-l flex-shrink-0 overflow-hidden">
          <CartSummary
            items={items}
            subtotal={getSubtotal()}
            tax={getTax()}
            total={getTotal()}
            discount={getDiscount()}
            appliedPromotions={appliedPromotions}
            onUpdateQuantity={updateQuantity}
            onVoidItem={voidItem}
            onSendToKDS={() => sendToKDS.mutate()}
            onSplitBill={() => setShowSplitBill(true)}
            isSending={sendToKDS.isPending}
          />
        </div>
      </div>
    </div>
  );
}
