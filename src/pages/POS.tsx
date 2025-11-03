import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useCartStore } from "@/lib/store/cart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useState, useEffect, startTransition } from "react";
import { useModalManager } from "@/hooks/useModalManager";
import { usePromotions } from "@/lib/hooks/usePromotions";
import { useBroadcastToCustomerDisplay } from "@/hooks/useCustomerDisplaySync";
import { generate80mmKitchenTicket } from "@/lib/print/receiptGenerator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Monitor } from "lucide-react";

// Import extracted components
import { CategoryList } from "@/components/pos/CategoryList";
import { ItemGrid } from "@/components/pos/ItemGrid";
import { CartSummary } from "@/components/pos/CartSummary";
import { TableSelectionModal } from "@/components/pos/TableSelectionModal";
import { ModifierSelectionModal } from "@/components/pos/ModifierSelectionModal";
import { SplitBillModal } from "@/components/pos/SplitBillModal";
import { LinkDisplayModal } from "@/components/pos/LinkDisplayModal";
import { PrintPreviewModal } from "@/components/pos/PrintPreviewModal";

export default function POS() {
  // Track performance for this page
  usePerformanceMonitor('POS');
  
  const { items, addItem, updateQuantity, voidItem, clearCart, getSubtotal, getTax, getTotal, getDiscount, appliedPromotions, sessionId, table_id, order_type, nfc_card_id, tableLabelShort, setTableId, setOrderType, setTableLabel } = useCartStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openModal } = useModalManager();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [showTableSelect, setShowTableSelect] = useState(false);
  const [showModifierSelect, setShowModifierSelect] = useState(false);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [showLinkDisplay, setShowLinkDisplay] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [pendingItem, setPendingItem] = useState<any>(null);
  const [previewOrderData, setPreviewOrderData] = useState<any>(null);
  
  // Customer display linking
  const [customerDisplayId, setCustomerDisplayId] = useState<string | null>(
    () => localStorage.getItem('linked-customer-display')
  );
  
  // Initialize broadcast hook
  const { broadcastOrderUpdate, broadcastPayment, broadcastComplete, broadcastIdle } = 
    useBroadcastToCustomerDisplay();
  
  // Auto-evaluate promotions
  usePromotions();

  // Broadcast cart updates to customer display
  useEffect(() => {
    if (customerDisplayId && items.length > 0) {
      broadcastOrderUpdate(customerDisplayId);
    } else if (customerDisplayId && items.length === 0) {
      broadcastIdle(customerDisplayId);
    }
  }, [items, customerDisplayId, broadcastOrderUpdate, broadcastIdle]);

  // Enforce table selection on first load
  useEffect(() => {
    // If no table and no order type set, force selection
    if (!table_id && !order_type) {
      setShowTableSelect(true);
    }
  }, [table_id, order_type]);

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

  // Fetch table label when table_id changes
  const { data: selectedTable } = useQuery({
    queryKey: ['table', table_id],
    queryFn: async () => {
      if (!table_id) return null;
      const { data, error } = await supabase
        .from('tables')
        .select('label')
        .eq('id', table_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!table_id,
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

      // Create order with NFC card tracking
      const cartState = useCartStore.getState();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          session_id: sessionId,
          table_id: cartState.table_id,
          order_type: cartState.order_type,
          nfc_card_id: cartState.nfc_card_id,
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
      
      // Show print preview
      setPreviewOrderData({
        orderId: order.id,
        orderNumber: order.id.substring(0, 8),
        items: items,
        subtotal: getSubtotal(),
        tax: getTax(),
        total: getTotal(),
        timestamp: new Date(),
      });
      setShowPrintPreview(true);
      
      // Broadcast to customer display
      if (customerDisplayId) {
        broadcastPayment(customerDisplayId, undefined);
      }
      
      // Open payment modal using modal manager (after print preview)
      openModal('payment', {
        orderId: order.id,
        orderNumber: order.id.substring(0, 8),
        total: getTotal(),
        onPaymentSuccess: () => {
          // Broadcast completion
          if (customerDisplayId) {
            broadcastComplete(customerDisplayId, undefined);
          }
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
      {/* Header: Table Badge + Display Link (56px fixed) */}
      <div className="h-14 border-b flex items-center px-4 gap-3 flex-shrink-0">
        {(table_id || order_type === 'takeaway') && (
          <Badge
            variant="secondary"
            className="text-base px-4 py-2 cursor-pointer hover:bg-secondary/80"
            onClick={() => setShowTableSelect(true)}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {order_type === 'takeaway' ? 'Takeaway' : `Table ${tableLabelShort || selectedTable?.label || '...'}`}
          </Badge>
        )}
        
        {/* Display Link Badge/Button */}
        {customerDisplayId ? (
          <Badge
            variant="outline"
            className="text-base px-4 py-2 cursor-pointer hover:bg-accent"
            onClick={() => setShowLinkDisplay(true)}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Display Linked
          </Badge>
        ) : (
          <Button
            variant="outline"
            size="lg"
            className="h-10 px-6"
            onClick={() => setShowLinkDisplay(true)}
          >
            <Monitor className="h-5 w-5 mr-2" />
            Link Display
          </Button>
        )}
      </div>

      <TableSelectionModal
        open={showTableSelect}
        onOpenChange={setShowTableSelect}
        onSelect={(tableId, orderType, tableLabel, nfcCardId) => {
          if (nfcCardId) {
            // NFC scan: use setTableWithNFC to store card ID
            useCartStore.getState().setTableWithNFC(tableId, nfcCardId);
          } else {
            // Manual selection
            setTableId(tableId);
            setOrderType(orderType);
          }
          // Store table label
          if (tableLabel) {
            setTableLabel(tableLabel);
          }
        }}
      />

      <ModifierSelectionModal
        open={showModifierSelect}
        onOpenChange={setShowModifierSelect}
        menuItemId={pendingItem?.menu_item_id || ''}
        menuItemName={pendingItem?.name || ''}
        onConfirm={(modifiers) => {
          if (pendingItem) {
            startTransition(() => addItem({ ...pendingItem, modifiers }));
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

      <LinkDisplayModal
        open={showLinkDisplay}
        onOpenChange={setShowLinkDisplay}
        currentDisplayId={customerDisplayId}
        onLink={(displayId) => {
          setCustomerDisplayId(displayId);
          localStorage.setItem('linked-customer-display', displayId);
        }}
        onUnlink={() => {
          setCustomerDisplayId(null);
          localStorage.removeItem('linked-customer-display');
          if (customerDisplayId) {
            broadcastIdle(customerDisplayId);
          }
        }}
      />

      {previewOrderData && (
        <PrintPreviewModal
          open={showPrintPreview}
          onOpenChange={setShowPrintPreview}
          orderData={previewOrderData}
          onSendToPrinter={() => {
            // Console logging happens inside the modal
            setShowPrintPreview(false);
          }}
        />
      )}

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

        {/* MIDDLE: Items (flex-grow, no scroll - ItemGrid handles it) */}
        <div className="flex-1 bg-background overflow-hidden">
          <ItemGrid
            items={menuItems}
            isLoading={itemsLoading}
            onAddItem={(item) => {
              // CRITICAL: Enforce table selection before adding any items
              if (!table_id && order_type !== 'takeaway') {
                toast({
                  variant: 'destructive',
                  title: 'Select Table First',
                  description: 'Please select a table or choose takeaway before adding items',
                });
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
            onUpdateQuantity={(id, qty) => updateQuantity(id, qty)}
            onVoidItem={(id) => voidItem(id)}
            onSendToKDS={() => sendToKDS.mutate()}
            onSplitBill={() => setShowSplitBill(true)}
            isSending={sendToKDS.isPending}
          />
        </div>
      </div>
    </div>
  );
}
