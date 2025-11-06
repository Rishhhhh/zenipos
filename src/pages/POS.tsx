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
import { useOrderRealtime } from "@/hooks/useOrderRealtime";
import { generate80mmKitchenTicket } from "@/lib/print/receiptGenerator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Monitor, NfcIcon } from "lucide-react";

// Import extracted components
import { CategoryList } from "@/components/pos/CategoryList";
import { ItemGrid } from "@/components/pos/ItemGrid";
import { CartSummary } from "@/components/pos/CartSummary";
import { TableSelectionModal } from "@/components/pos/TableSelectionModal";
import { ModifierSelectionModal } from "@/components/pos/ModifierSelectionModal";
import { SplitBillModal } from "@/components/pos/SplitBillModal";
import { LinkDisplayModal } from "@/components/pos/LinkDisplayModal";
import { PrintPreviewModal } from "@/components/pos/PrintPreviewModal";
import { OrderConfirmationModal } from "@/components/pos/OrderConfirmationModal";
import { NFCCardSelectionModal } from "@/components/pos/NFCCardSelectionModal";
import { OrderTypeSelectionModal } from "@/components/pos/OrderTypeSelectionModal";
import { PaymentNFCScannerModal } from "@/components/pos/PaymentNFCScannerModal";
import { PaymentModal } from "@/components/pos/PaymentModal";

// Cache-bust verification and build tracking
const BUILD_TIMESTAMP = '2025-11-04T01:50:00Z';
console.log('🔵 POS.tsx loaded at:', new Date().toISOString());
console.log('🔵 Build timestamp:', BUILD_TIMESTAMP);
console.log('🔵 Using RPC function: create_order_with_items');
console.log('🔵 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

export default function POS() {
  // Track performance for this page
  usePerformanceMonitor('POS');
  
  // Enable system-wide real-time order sync
  useOrderRealtime();
  
  const { items, addItem, updateQuantity, voidItem, clearCart, clearCartItems, clearNFCCard, getSubtotal, getTax, getTotal, getDiscount, appliedPromotions, sessionId, table_id, order_type, nfc_card_id, nfcCardUid, tableLabelShort, setTableId, setOrderType, setTableLabel, setNFCCardId } = useCartStore();
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
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [showNFCCardSelect, setShowNFCCardSelect] = useState(false);
  const [showOrderTypeSelect, setShowOrderTypeSelect] = useState(false);
  const [showPaymentNFCScanner, setShowPaymentNFCScanner] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<any>(null);
  
  // Customer display linking - fetch from database instead of localStorage
  const { data: linkedDisplay } = useQuery({
    queryKey: ['linked-display'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('pos_displays')
        .select('display_id')
        .eq('linked_by_user_id', user.id)
        .eq('active', true)
        .single();
      
      return data?.display_id || null;
    },
  });
  
  const customerDisplayId = linkedDisplay || null;
  
  // Initialize broadcast hook
  const { broadcastOrderUpdate, broadcastPayment, broadcastComplete, broadcastIdle } = 
    useBroadcastToCustomerDisplay();
  
  // Auto-evaluate promotions
  usePromotions();

  // Debug logging
  useEffect(() => {
    console.log('🟢 POS Component State:', {
      itemsCount: items.length,
      table_id,
      order_type,
      tableLabelShort,
      nfc_card_id,
      sessionId,
    });
  }, [items.length, table_id, order_type, tableLabelShort, nfc_card_id]);

  // Broadcast cart updates to customer display
  useEffect(() => {
    if (customerDisplayId && items.length > 0) {
      broadcastOrderUpdate(customerDisplayId);
    } else if (customerDisplayId && items.length === 0) {
      broadcastIdle(customerDisplayId);
    }
  }, [items, customerDisplayId, broadcastOrderUpdate, broadcastIdle]);

  // NFC-first flow: enforce card -> order type -> table selection
  useEffect(() => {
    // Step 1: If no NFC card, show card selection FIRST
    if (!nfc_card_id) {
      setShowNFCCardSelect(true);
      return;
    }
    
    // Step 2: If have NFC but no order type, show order type selection
    if (nfc_card_id && !order_type) {
      setShowOrderTypeSelect(true);
      return;
    }
    
    // Step 3: If dine-in but no table, show table selection
    if (order_type === 'dine_in' && !table_id) {
      setShowTableSelect(true);
      return;
    }
  }, [nfc_card_id, order_type, table_id]);

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

  // Confirm and send order to KDS
  const confirmAndSendOrder = useMutation({
    mutationFn: async (orderNotes?: string) => {
      console.log('🔵 Starting order creation...', {
        items: items.length,
        table_id: useCartStore.getState().table_id,
        order_type: useCartStore.getState().order_type,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const subtotal = getSubtotal();
      const tax = getTax();
      const discount = getDiscount();
      const total = getTotal();

      // Create order via RPC function (bypasses client library status issue)
      const cartState = useCartStore.getState();
      
      const orderItems = items.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.price,
        notes: item.notes || null,
        modifiers: item.modifiers || [],
      }));

      // Build RPC parameters object for detailed logging
      const rpcParams = {
        p_session_id: sessionId,
        p_table_id: cartState.table_id,
        p_order_type: cartState.order_type,
        p_nfc_card_id: cartState.nfc_card_id,
        p_open_tab_id: null,
        p_subtotal: subtotal,
        p_tax: tax,
        p_discount: discount,
        p_total: total,
        p_applied_promotions: appliedPromotions.map((p) => ({
          id: p.promotion.id,
          name: p.promotion.name,
          discount: p.discount,
        })),
        p_created_by: user.id,
        p_metadata: (orderNotes ? { notes: orderNotes } : {}),
        p_items: orderItems,
      };

      console.log('📤 Creating order via RPC function...');
      console.log('📤 RPC PARAMS:', JSON.stringify(rpcParams, null, 2));
      console.log('📤 PARAM KEYS:', Object.keys(rpcParams));
      console.log('📤 HAS STATUS PARAM?:', 'status' in rpcParams || 'p_status' in rpcParams);
      console.log('📤 BUILD TIMESTAMP:', BUILD_TIMESTAMP);

      const { data: result, error: orderError } = await supabase.rpc('create_order_with_items', rpcParams as any);

      if (orderError) {
        console.error('❌ Order creation failed:', orderError);
        throw orderError;
      }

      console.log('✅ Order created via RPC:', result);

      // Fetch the created order for the rest of the flow
      const resultData = result as { order_id: string; status: string };
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select()
        .eq('id', resultData.order_id)
        .single();

      if (fetchError || !order) {
        console.error('❌ Failed to fetch created order:', fetchError);
        throw fetchError || new Error('Order not found after creation');
      }

      console.log('✅ Order fetched:', order);

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
    onSuccess: async (order) => {
      console.log('✅ Order submitted successfully:', order.id);
      
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

      // Update order status to 'preparing' after confirming print
      await supabase
        .from('orders')
        .update({ status: 'preparing' })
        .eq('id', order.id);

      console.log('✅ Order status updated to preparing');

      // Update table status: mark as occupied with current order
      if (table_id) {
        await supabase
          .from('tables')
          .update({
            status: 'occupied',
            current_order_id: order.id,
            seated_at: new Date().toISOString(),
            last_order_at: new Date().toISOString(),
          })
          .eq('id', table_id);
      }

      // Broadcast to customer display
      if (customerDisplayId) {
        broadcastOrderUpdate(customerDisplayId);
      }

      toast({
        title: "Order sent to Kitchen",
        description: `Order #${order.id.substring(0, 8)} - ${items.length} items. Customer can pay after meal.`,
      });

      // Clear cart items but preserve NFC card for payment
      clearCartItems();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      console.error('❌ Order creation error:', error);
      toast({
        variant: "destructive",
        title: "Failed to send order",
        description: error.message || 'Please try again',
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

        {/* Show selected NFC card in header - CLICKABLE */}
        {nfc_card_id && (
          <Badge
            variant="outline"
            className="text-base px-4 py-2 bg-green-500/10 border-green-500 cursor-pointer hover:bg-green-500/20 transition-colors"
            onClick={() => {
              // Confirm before changing card if cart has items
              if (items.length > 0) {
                if (confirm('Changing NFC card will clear the current cart. Continue?')) {
                  clearCart();
                  setShowNFCCardSelect(true);
                }
              } else {
                // No items, safe to change card
                clearNFCCard();
                setShowNFCCardSelect(true);
              }
            }}
          >
            <NfcIcon className="h-4 w-4 mr-2" />
            Card: {nfcCardUid || nfc_card_id.slice(0, 8)}
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

        {/* Scan Card to Pay Button */}
        <Button
          variant="default"
          size="lg"
          className="h-10 px-6 ml-auto"
          onClick={() => setShowPaymentNFCScanner(true)}
        >
          <NfcIcon className="h-5 w-5 mr-2" />
          Scan Card to Pay
        </Button>
      </div>

      <NFCCardSelectionModal
        open={showNFCCardSelect}
        onOpenChange={setShowNFCCardSelect}
        onSelect={(cardId, cardUid) => {
          // Store NFC card in cart
          setNFCCardId(cardId, cardUid);
          setShowNFCCardSelect(false);
          // Proceed to order type selection
          setShowOrderTypeSelect(true);
        }}
      />

      <OrderTypeSelectionModal
        open={showOrderTypeSelect}
        onOpenChange={setShowOrderTypeSelect}
        nfcCardUid={nfcCardUid || 'Unknown'}
        onSelectDineIn={() => {
          setOrderType('dine_in');
          setShowOrderTypeSelect(false);
          // Open table selection for dine-in
          setShowTableSelect(true);
        }}
        onSelectTakeaway={() => {
          setOrderType('takeaway');
          setShowOrderTypeSelect(false);
          // No table selection needed for takeaway
          // User can now proceed to menu selection
        }}
      />

      <PaymentNFCScannerModal
        open={showPaymentNFCScanner}
        onOpenChange={setShowPaymentNFCScanner}
        onOrderFound={(order) => {
          setPendingPaymentOrder(order);
          setShowPaymentNFCScanner(false);
          setShowPaymentModal(true);
        }}
      />

      {pendingPaymentOrder && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          orderId={pendingPaymentOrder.id}
          orderNumber={pendingPaymentOrder.id.slice(0, 8)}
          total={pendingPaymentOrder.total}
          onPaymentSuccess={() => {
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['pending-orders-nfc'] });
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            
            // Clear payment modal state
            setPendingPaymentOrder(null);
            setShowPaymentModal(false);
            setShowPaymentNFCScanner(false);
            
            // CRITICAL: Clear ALL cart data including NFC card
            clearCart();
            
            // Broadcast cart clear to customer display
            if (customerDisplayId) {
              broadcastIdle(customerDisplayId);
            }
            
            // Show success toast
            toast({
              title: 'Payment Complete',
              description: 'Order paid successfully. Ready for next customer.',
            });
            
            // The useEffect hook will automatically show NFC card selection modal
          }}
        />
      )}

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
          // Display linked successfully - query will auto-refetch
          queryClient.invalidateQueries({ queryKey: ['linked-display'] });
        }}
        onUnlink={() => {
          // Display unlinked - broadcast idle and refetch
          if (customerDisplayId) {
            broadcastIdle(customerDisplayId);
          }
          queryClient.invalidateQueries({ queryKey: ['linked-display'] });
        }}
      />

      <OrderConfirmationModal
        open={showOrderConfirmation}
        onOpenChange={setShowOrderConfirmation}
        items={items}
        subtotal={getSubtotal()}
        tax={getTax()}
        total={getTotal()}
        discount={getDiscount()}
        appliedPromotions={appliedPromotions}
        tableName={tableLabelShort || selectedTable?.label}
        orderType={order_type || 'dine_in'}
        onConfirm={(notes) => {
          setShowOrderConfirmation(false);
          confirmAndSendOrder.mutate(notes);
        }}
        onEdit={() => setShowOrderConfirmation(false)}
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
              // CRITICAL: Enforce NFC card first
              if (!nfc_card_id) {
                toast({
                  variant: 'destructive',
                  title: 'Scan Card First',
                  description: 'Please scan your NFC card before ordering',
                });
                setShowNFCCardSelect(true);
                return;
              }

              // CRITICAL: Enforce order type selection
              if (!order_type) {
                toast({
                  variant: 'destructive',
                  title: 'Select Order Type',
                  description: 'Please choose Dine In or Takeaway',
                });
                setShowOrderTypeSelect(true);
                return;
              }
              
              // CRITICAL: Enforce table selection for dine-in orders
              if (order_type === 'dine_in' && !table_id) {
                toast({
                  variant: 'destructive',
                  title: 'Select Table First',
                  description: 'Please select a table before adding items',
                });
                setShowTableSelect(true);
                return;
              }
              
              // Takeaway orders can proceed without table
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
            onSendToKDS={() => setShowOrderConfirmation(true)}
            onSplitBill={() => setShowSplitBill(true)}
            isSending={confirmAndSendOrder.isPending}
          />
        </div>
      </div>
    </div>
  );
}
