import { useEffect, startTransition, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/lib/store/cart';
import { useToast } from '@/hooks/use-toast';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { usePOSLogic } from '@/hooks/usePOSLogic';
import { usePOSRealtime } from '@/hooks/usePOSRealtime';
import { usePOSPayments } from '@/hooks/usePOSPayments';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useTillSession } from '@/contexts/TillSessionContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MapPin, Monitor, NfcIcon, ChevronRight, ShoppingCart, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Import extracted components
import { CategoryList } from '@/components/pos/CategoryList';
import { ItemGrid } from '@/components/pos/ItemGrid';
import { CartSummary } from '@/components/pos/CartSummary';
import { TableSelectionModal } from '@/components/pos/TableSelectionModal';
import { ModifierSelectionModal } from '@/components/pos/ModifierSelectionModal';
import { SplitBillModal } from '@/components/pos/SplitBillModal';
import { LinkDisplayModal } from '@/components/pos/LinkDisplayModal';
import { PrintPreviewModal } from '@/components/pos/PrintPreviewModal';
import { OrderConfirmationModal } from '@/components/pos/OrderConfirmationModal';
import { NFCCardSelectionModal } from '@/components/pos/NFCCardSelectionModal';
import { PaymentNFCScannerModal } from '@/components/pos/PaymentNFCScannerModal';
import { PaymentModal } from '@/components/pos/PaymentModal';

export default function POS() {
  // Track performance
  usePerformanceMonitor('POS');
  
  // Till session management
  const { activeTillSession, getCurrentCashPosition } = useTillSession();
  
  // Device detection
  const { device, isMobile, isTablet } = useDeviceDetection();
  const [mobileTab, setMobileTab] = useState<'menu' | 'cart'>('menu');
  
  // Router hooks
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Cart store
  const { 
    items, 
    addItem, 
    updateQuantity, 
    voidItem, 
    clearCart,
    clearNFCCard,
    getSubtotal, 
    getTax, 
    getTotal, 
    getDiscount,
    appliedPromotions,
    table_id,
    order_type,
    nfc_card_id,
    nfcCardUid,
    tableLabelShort,
    setTableId,
    setOrderType,
    setTableLabel,
    setNFCCardId
  } = useCartStore();
  
  // PERFORMANCE: Prefetch NFC cards AND tables immediately on POS mount
  useEffect(() => {
    const prefetchData = async () => {
      // Prefetch NFC cards
      queryClient.prefetchQuery({
        queryKey: ['nfc-cards', 'active'],
        queryFn: async () => {
          const { data } = await supabase
            .from('nfc_cards')
            .select('id, card_uid, status, notes, last_scanned_at, scan_count')
            .eq('status', 'active')
            .order('card_uid');
          return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
      
      // Prefetch tables with orders using the exact query TableSelectionModal uses
      const { getTablesWithOrders } = await import('@/lib/queries/tableQueries');
      queryClient.prefetchQuery({
        queryKey: ['tables-with-orders'],
        queryFn: getTablesWithOrders,
        staleTime: 2 * 60 * 1000, // Cache for 2 minutes
      });
    };
    
    prefetchData();
  }, [queryClient]);
  
  // Auto-reconnect printers on POS mount
  useEffect(() => {
    const autoReconnectPrinters = async () => {
      console.log('🔄 [POS] Auto-reconnecting printers...');
      
      const { data: offlineDevices } = await supabase
        .from('devices')
        .select('*')
        .eq('role', 'PRINTER')
        .eq('status', 'offline');
      
      if (!offlineDevices || offlineDevices.length === 0) return;
      
      for (const device of offlineDevices) {
        try {
          // For browser-only printers (no IP), check if window.print exists
          if (!device.ip_address && typeof window.print === 'function') {
            await supabase
              .from('devices')
              .update({ status: 'online', last_seen: new Date().toISOString() })
              .eq('id', device.id);
            
            console.log(`✅ [POS] Auto-reconnected printer: ${device.name}`);
          }
        } catch (error) {
          console.error(`Failed to auto-reconnect ${device.name}:`, error);
        }
      }
    };
    
    autoReconnectPrinters();
  }, []);
  
  // Handle loading existing order from table management
  useEffect(() => {
    const { tableId, existingOrderId, returnTo } = location.state || {};
    
    if (existingOrderId && tableId) {
      // Load existing order items
      const loadExistingOrder = async () => {
        try {
          const { data: order, error } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (
                id,
                quantity,
                unit_price,
                notes,
                modifiers,
                menu_items (id, name, price)
              )
            `)
            .eq('id', existingOrderId)
            .single();
          
          if (error) throw error;
          
          if (order) {
            // Set table
            setTableId(tableId);
            setOrderType('dine_in');
            
            // Add existing items to cart
            order.order_items?.forEach((item: any) => {
              // Add item multiple times based on quantity
              for (let i = 0; i < item.quantity; i++) {
                addItem({
                  menu_item_id: item.menu_items.id,
                  name: item.menu_items.name,
                  price: item.unit_price,
                  notes: item.notes,
                  modifiers: item.modifiers || [],
                });
              }
            });
            
            toast({
              title: 'Order Loaded',
              description: 'Existing order items loaded. Add more items below.',
            });
          }
          
          // Clear location state
          navigate(location.pathname, { replace: true, state: {} });
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Failed to load order',
            description: error.message,
          });
        }
      };
      
      loadExistingOrder();
    }
  }, [location.state]);
  
  // Business logic hook
  const {
    categories,
    categoriesLoading,
    menuItems,
    itemsLoading,
    selectedTable,
    customerDisplayId,
    confirmAndSendOrder,
    selectedCategoryId,
    setSelectedCategoryId,
    showTableSelect,
    setShowTableSelect,
    showModifierSelect,
    setShowModifierSelect,
    showSplitBill,
    setShowSplitBill,
    showLinkDisplay,
    setShowLinkDisplay,
    showPrintPreview,
    setShowPrintPreview,
    showOrderConfirmation,
    setShowOrderConfirmation,
    showNFCCardSelect,
    setShowNFCCardSelect,
    pendingItem,
    setPendingItem,
    previewOrderData,
    setPreviewOrderData,
  } = usePOSLogic();

  // Real-time synchronization hook
  const { broadcastOrderUpdate, broadcastIdle } = usePOSRealtime(customerDisplayId);

  // Payment flow hook
  const {
    showPaymentNFCScanner,
    setShowPaymentNFCScanner,
    showPaymentModal,
    setShowPaymentModal,
    pendingPaymentOrder,
    handlePaymentSuccess,
    handleOrderFound,
  } = usePOSPayments(broadcastIdle, customerDisplayId, setPreviewOrderData, setShowPrintPreview);

  // NFC-first flow: Direct to table selection after card scan
  useEffect(() => {
    console.log('🔍 POS Flow Check:', { nfc_card_id, order_type, table_id });
    
    // EXIT EARLY: If everything is set, don't show any modals
    if (nfc_card_id && order_type && (order_type === 'takeaway' || table_id)) {
      console.log('✅ All values set, no modal needed');
      return;
    }
    
    // Step 1: No card? Show NFC selection
    if (!nfc_card_id) {
      console.log('📱 Opening NFC card selection');
      setShowNFCCardSelect(true);
      return;
    }
    
    // Step 2: Card set but no order type or table? Show table selection (which includes order type choice)
    if (nfc_card_id && (!order_type || (order_type === 'dine_in' && !table_id))) {
      console.log('🪑 Opening table selection');
      const timer = setTimeout(() => setShowTableSelect(true), 50);
      return () => clearTimeout(timer);
    }
  }, [nfc_card_id, order_type, table_id]);

  // Open modifier modal when pendingItem is set (prevents race condition)
  useEffect(() => {
    if (pendingItem && !showModifierSelect) {
      console.log('✅ Opening modifier modal for:', pendingItem.name, 'ID:', pendingItem.menu_item_id);
      setShowModifierSelect(true);
    }
  }, [pendingItem, showModifierSelect]);

  return (
    <div className="pos-container h-screen flex flex-col overflow-hidden">
      {/* Header: Consolidated Status Badges + Actions */}
      <div className="h-14 border-b flex items-center justify-between px-4 gap-3 flex-shrink-0">
        {/* LEFT: Status Badges */}
        <div className="flex items-center gap-2">
          {/* NFC Card Badge */}
          {nfc_card_id && (
            <Badge
              variant="outline"
              className="text-sm px-3 py-1.5 bg-emerald-500/10 border-emerald-500 cursor-pointer hover:bg-emerald-500/20 transition-colors"
              onClick={() => {
                // Always open card selection when badge is clicked
                if (items.length > 0) {
                  if (confirm('Changing NFC card will clear the current cart. Continue?')) {
                    clearCart();
                    setShowNFCCardSelect(true);
                  }
                } else {
                  clearNFCCard();
                  setShowNFCCardSelect(true);
                }
              }}
            >
              <NfcIcon className="h-3.5 w-3.5 mr-1.5" />
              {nfcCardUid || nfc_card_id.slice(0, 8)}
            </Badge>
          )}

          {/* Order Type Badge (Dine In / Takeaway) */}
          {order_type && (
            <Badge
              variant={order_type === 'takeaway' ? 'secondary' : 'default'}
              className="text-sm px-3 py-1.5"
            >
              {order_type === 'takeaway' ? '🥡 Takeaway' : '🍽️ Dine In'}
            </Badge>
          )}

          {/* Table Badge (only for dine-in) */}
          {order_type === 'dine_in' && table_id && (
            <Badge
              variant="outline"
              className="text-sm px-3 py-1.5 bg-amber-500/10 border-amber-500 cursor-pointer hover:bg-amber-500/20"
              onClick={() => setShowTableSelect(true)}
            >
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              {tableLabelShort || selectedTable?.label || 'Select Table'}
            </Badge>
          )}
        </div>

        {/* RIGHT: Till Widget + Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Till Widget */}
          {activeTillSession && activeTillSession.status === 'open' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500 rounded-md">
              <Wallet className="h-4 w-4 text-green-600" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Till:</span>
                <span className="text-sm font-semibold">RM {getCurrentCashPosition().toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Scan Card to Pay Button */}
          <Button
            variant="outline"
            size="sm"
            className="text-sm px-4 py-2 bg-primary/10 border-primary hover:bg-primary/20"
            onClick={() => setShowPaymentNFCScanner(true)}
          >
            <NfcIcon className="h-4 w-4 mr-2" />
            Scan Card to Pay
          </Button>

          {/* Customer Display Link (if active) */}
          {customerDisplayId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLinkDisplay(true)}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Display
            </Button>
          )}
        </div>
      </div>

      {/* NFC Card Selection Modal */}
      <NFCCardSelectionModal
        open={showNFCCardSelect}
        onOpenChange={setShowNFCCardSelect}
        onSelect={(cardId, cardUid) => {
          setNFCCardId(cardId, cardUid);
          setShowNFCCardSelect(false);
          // Always open table selection after NFC card scan
          setShowTableSelect(true);
        }}
      />

      {/* Payment NFC Scanner Modal */}
      <PaymentNFCScannerModal
        open={showPaymentNFCScanner}
        onOpenChange={setShowPaymentNFCScanner}
        onOrderFound={handleOrderFound}
      />

      {/* Payment Modal */}
      {pendingPaymentOrder && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          orderId={pendingPaymentOrder.id}
          orderNumber={pendingPaymentOrder.id.slice(0, 8)}
          total={pendingPaymentOrder.total}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Table Selection Modal */}
      <TableSelectionModal
        open={showTableSelect}
        onOpenChange={setShowTableSelect}
        onSelect={(tableId, orderType, tableLabel, nfcCardId) => {
          // Close table modal first
          setShowTableSelect(false);
          
          // Update cart state
          if (nfcCardId) {
            useCartStore.getState().setTableWithNFC(tableId, nfcCardId);
          } else {
            setTableId(tableId);
            setOrderType(orderType); // Auto-set 'dine_in' when table is selected
          }
          
          if (tableLabel) {
            setTableLabel(tableLabel);
          }
          
          // Don't show order type modal - already determined by table selection
        }}
      />

      {/* Modifier Selection Modal */}
      <ModifierSelectionModal
        open={showModifierSelect}
        onOpenChange={(open) => {
          setShowModifierSelect(open);
          if (!open) {
            console.log('🚪 Modal closed, clearing pending item');
            setPendingItem(null);
          }
        }}
        menuItemId={pendingItem?.menu_item_id || ''}
        menuItemName={pendingItem?.name || ''}
        onConfirm={(modifiers) => {
          if (pendingItem) {
            console.log('✔️ Modifiers confirmed:', modifiers);
            startTransition(() => addItem({ ...pendingItem, modifiers }));
            setPendingItem(null);
            setShowModifierSelect(false);
          }
        }}
      />

      {/* Split Bill Modal */}
      <SplitBillModal
        open={showSplitBill}
        onOpenChange={setShowSplitBill}
        items={items}
        total={getTotal()}
        onSplitConfirm={(splits) => {
          toast({
            title: `Bill split into ${splits.length} parts`,
            description: 'Each split can now be paid separately',
          });
          setShowSplitBill(false);
        }}
      />

      {/* Link Display Modal */}
      <LinkDisplayModal
        open={showLinkDisplay}
        onOpenChange={setShowLinkDisplay}
        currentDisplayId={customerDisplayId}
        onLink={() => {
          queryClient.invalidateQueries({ queryKey: ['linked-display'] });
        }}
        onUnlink={() => {
          if (customerDisplayId) {
            broadcastIdle(customerDisplayId);
          }
          queryClient.invalidateQueries({ queryKey: ['linked-display'] });
        }}
      />

      {/* Order Confirmation Modal */}
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

      {/* Print Preview Modal - Customer Receipt Only */}
      {previewOrderData && (
        <PrintPreviewModal
          open={showPrintPreview}
          onOpenChange={(open) => {
            setShowPrintPreview(open);
            if (!open) {
              setPreviewOrderData(null); // Clear data when modal closes
            }
          }}
          mode="customer"
          orderData={previewOrderData}
          onSendToPrinter={() => {
            setShowPrintPreview(false);
            setPreviewOrderData(null); // Clear data after printing
          }}
        />
      )}

      {/* MOBILE: Tabbed interface with categories drawer */}
      {isMobile && (
        <div className="pos-container flex flex-col" style={{ height: 'var(--available-height)' }}>
          {/* Tabs: Menu | Cart - flex-1 overflow-hidden */}
          <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as 'menu' | 'cart')} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full grid grid-cols-2 flex-shrink-0">
              <TabsTrigger value="menu" className="text-sm">
                Menu
              </TabsTrigger>
              <TabsTrigger value="cart" className="text-sm relative">
                Cart
                {items.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1 text-xs">
                    {items.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="menu" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
              <div className="flex h-full relative">
                {/* Categories Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="absolute top-2 left-2 z-10 h-8 px-2">
                      <ChevronRight className="w-4 h-4 mr-1" />
                      Categories
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] p-0">
                    <CategoryList
                      categories={categories}
                      isLoading={categoriesLoading}
                      selectedCategoryId={selectedCategoryId}
                      onSelectCategory={(id) => setSelectedCategoryId(id)}
                    />
                  </SheetContent>
                </Sheet>

                {/* Items Grid */}
                <div className="flex-1 overflow-hidden">
                  <ItemGrid
                    items={menuItems}
                    isLoading={itemsLoading}
                    onAddItem={(item) => {
                      if (!nfc_card_id) {
                        toast({
                          variant: 'destructive',
                          title: 'Scan Card First',
                          description: 'Please scan your NFC card before ordering',
                        });
                        setShowNFCCardSelect(true);
                        return;
                      }
                      if (!order_type) {
                        toast({
                          variant: 'destructive',
                          title: 'Select Order Type',
                          description: 'Please scan NFC card and select table first',
                        });
                        setShowTableSelect(true);
                        return;
                      }
                      if (order_type === 'dine_in' && !table_id) {
                        toast({
                          variant: 'destructive',
                          title: 'Select Table First',
                          description: 'Please select a table before adding items',
                        });
                        setShowTableSelect(true);
                        return;
                      }
                      setPendingItem(item);
                      setMobileTab('cart');
                    }}
                    categoryId={selectedCategoryId}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cart" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
              <CartSummary
                items={items}
                subtotal={getSubtotal()}
                tax={getTax()}
                total={getTotal()}
                discount={getDiscount()}
                appliedPromotions={appliedPromotions}
                onUpdateQuantity={updateQuantity}
                onVoidItem={voidItem}
                onSendToKDS={() => setShowOrderConfirmation(true)}
                onSplitBill={items.length > 0 ? () => setShowSplitBill(true) : undefined}
                isSending={confirmAndSendOrder.isPending}
              />
            </TabsContent>
          </Tabs>

          {/* Mobile Sticky Bottom Bar - only show when on menu tab */}
          {mobileTab === 'menu' && items.length > 0 && (
            <div 
              className="flex-shrink-0 border-t bg-card/95 backdrop-blur-sm p-3"
              style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {items.length} items
                  </p>
                  <p className="text-lg font-bold text-primary">
                    RM {getTotal().toFixed(2)}
                  </p>
                </div>
                <Button
                  onClick={() => setMobileTab('cart')}
                  className="h-12 px-6"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Cart
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PORTRAIT TABLET: 2-column (menu with drawer | cart) */}
      {device === 'portrait-tablet' && (
        <div className="pos-container flex flex-col" style={{ height: 'var(--available-height)' }}>
          {/* Status Bar - flex-shrink-0 */}
          <div className="flex-shrink-0 p-2 border-b bg-muted/30 flex items-center gap-2">
            {nfc_card_id && nfcCardUid && (
              <Badge variant="outline" className="text-xs">
                <NfcIcon className="w-3 h-3 mr-1" />
                {nfcCardUid}
              </Badge>
            )}
            {order_type && (
              <Badge variant="secondary" className="text-xs">
                {order_type === 'dine_in' ? 'Dine In' : 'Takeaway'}
              </Badge>
            )}
            {table_id && tableLabelShort && (
              <Badge variant="default" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                {tableLabelShort}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLinkDisplay(true)}
              className="ml-auto h-7 px-2 text-xs"
            >
              <Monitor className="w-3 h-3 mr-1" />
              {customerDisplayId ? 'Linked' : 'Link'}
            </Button>
          </div>

          {/* 2-Column Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT: Menu */}
            <div className="flex-1 relative overflow-hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="absolute top-2 left-2 z-10 h-8 px-2">
                    Categories
                    {selectedCategoryId && categories && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                        {categories.find(c => c.id === selectedCategoryId)?.name?.slice(0, 3)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0">
                  <CategoryList
                    categories={categories}
                    isLoading={categoriesLoading}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={setSelectedCategoryId}
                  />
                </SheetContent>
              </Sheet>

              <ItemGrid
                items={menuItems}
                isLoading={itemsLoading}
                onAddItem={(item) => {
                  if (!nfc_card_id) {
                    setShowNFCCardSelect(true);
                    return;
                  }
                  if (!order_type || (order_type === 'dine_in' && !table_id)) {
                    setShowTableSelect(true);
                    return;
                  }
                  if (order_type === 'dine_in' && !table_id) {
                    setShowTableSelect(true);
                    return;
                  }
                  setPendingItem(item);
                }}
                categoryId={selectedCategoryId}
              />
            </div>

            {/* RIGHT: Cart */}
            <div className="w-80 border-l flex-shrink-0 overflow-hidden">
              <CartSummary
                items={items}
                subtotal={getSubtotal()}
                tax={getTax()}
                total={getTotal()}
                discount={getDiscount()}
                appliedPromotions={appliedPromotions}
                onUpdateQuantity={updateQuantity}
                onVoidItem={voidItem}
                onSendToKDS={() => setShowOrderConfirmation(true)}
                onSplitBill={items.length > 0 ? () => setShowSplitBill(true) : undefined}
                isSending={confirmAndSendOrder.isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* LANDSCAPE TABLET & DESKTOP: 3-column layout */}
      {!isMobile && device !== 'portrait-tablet' && (
        <div className="pos-container flex flex-col" style={{ height: 'var(--available-height)' }}>
          {/* 3-column layout - flex-1 overflow-hidden */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT: Categories */}
            <div className="w-60 border-r flex-shrink-0 overflow-hidden">
            <CategoryList
              categories={categories}
              isLoading={categoriesLoading}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          </div>

          {/* MIDDLE: Items */}
          <div className="flex-1 bg-background overflow-hidden">
            <ItemGrid
              items={menuItems}
              isLoading={itemsLoading}
              onAddItem={(item) => {
                console.log('🛒 Adding item:', item.name, 'ID:', item.menu_item_id);
                
                if (!nfc_card_id) {
                  toast({
                    variant: 'destructive',
                    title: 'Scan Card First',
                    description: 'Please scan your NFC card before ordering',
                  });
                  setShowNFCCardSelect(true);
                  return;
                }

                if (!order_type) {
                  toast({
                    variant: 'destructive',
                    title: 'Select Order Type',
                    description: 'Please scan NFC card and select table first',
                  });
                  setShowTableSelect(true);
                  return;
                }
                
                if (order_type === 'dine_in' && !table_id) {
                  toast({
                    variant: 'destructive',
                    title: 'Select Table First',
                    description: 'Please select a table before adding items',
                  });
                  setShowTableSelect(true);
                  return;
                }
                
                console.log('📦 Setting pending item:', item);
                setPendingItem(item);
              }}
              categoryId={selectedCategoryId}
            />
          </div>

          {/* RIGHT: Cart */}
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
      )}
    </div>
  );
}
