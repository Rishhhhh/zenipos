import { useEffect, startTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '@/lib/store/cart';
import { useToast } from '@/hooks/use-toast';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { usePOSLogic } from '@/hooks/usePOSLogic';
import { usePOSRealtime } from '@/hooks/usePOSRealtime';
import { usePOSPayments } from '@/hooks/usePOSPayments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Monitor, NfcIcon } from 'lucide-react';

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
import { OrderTypeSelectionModal } from '@/components/pos/OrderTypeSelectionModal';
import { PaymentNFCScannerModal } from '@/components/pos/PaymentNFCScannerModal';
import { PaymentModal } from '@/components/pos/PaymentModal';

export default function POS() {
  // Track performance
  usePerformanceMonitor('POS');
  
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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    showOrderTypeSelect,
    setShowOrderTypeSelect,
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
  } = usePOSPayments(broadcastIdle, customerDisplayId);

  // NFC-first flow: enforce card -> order type -> table selection
  useEffect(() => {
    if (!nfc_card_id) {
      setShowNFCCardSelect(true);
      return;
    }
    
    if (nfc_card_id && !order_type) {
      setShowOrderTypeSelect(true);
      return;
    }
    
    if (order_type === 'dine_in' && !table_id) {
      setShowTableSelect(true);
      return;
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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header: Table Badge + Display Link */}
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

        {nfc_card_id && (
          <Badge
            variant="outline"
            className="text-base px-4 py-2 bg-green-500/10 border-green-500 cursor-pointer hover:bg-green-500/20 transition-colors"
            onClick={() => {
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
            <NfcIcon className="h-4 w-4 mr-2" />
            Card: {nfcCardUid || nfc_card_id.slice(0, 8)}
          </Badge>
        )}
        
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

      {/* NFC Card Selection Modal */}
      <NFCCardSelectionModal
        open={showNFCCardSelect}
        onOpenChange={setShowNFCCardSelect}
        onSelect={(cardId, cardUid) => {
          setNFCCardId(cardId, cardUid);
          setShowNFCCardSelect(false);
          setShowOrderTypeSelect(true);
        }}
      />

      {/* Order Type Selection Modal */}
      <OrderTypeSelectionModal
        open={showOrderTypeSelect}
        onOpenChange={setShowOrderTypeSelect}
        nfcCardUid={nfcCardUid || 'Unknown'}
        onSelectDineIn={() => {
          setOrderType('dine_in');
          setShowOrderTypeSelect(false);
          setShowTableSelect(true);
        }}
        onSelectTakeaway={() => {
          setOrderType('takeaway');
          setShowOrderTypeSelect(false);
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
          if (nfcCardId) {
            useCartStore.getState().setTableWithNFC(tableId, nfcCardId);
          } else {
            setTableId(tableId);
            setOrderType(orderType);
          }
          if (tableLabel) {
            setTableLabel(tableLabel);
          }
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

      {/* Print Preview Modal */}
      {previewOrderData && (
        <PrintPreviewModal
          open={showPrintPreview}
          onOpenChange={setShowPrintPreview}
          orderData={previewOrderData}
          onSendToPrinter={() => {
            setShowPrintPreview(false);
          }}
        />
      )}

      {/* Main Content: Categories + Items + Cart */}
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
                  description: 'Please choose Dine In or Takeaway',
                });
                setShowOrderTypeSelect(true);
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
              // Modal will open via useEffect to prevent race condition
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
  );
}
