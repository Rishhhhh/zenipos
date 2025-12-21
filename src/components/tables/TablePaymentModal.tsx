import { useState, useEffect, useRef } from 'react';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { PrintPreviewModal } from '@/components/pos/PrintPreviewModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { qzPrintReceiptEscpos, getConfiguredPrinterName } from '@/lib/print/qzEscposReceipt';
import { buildReceiptText80mm } from '@/lib/print/receiptText80mm';
import { buildReceiptText58mm } from '@/lib/print/receiptText58mm';
import { getCashDrawerSettings } from '@/lib/hardware/cashDrawer';
import { useLinkedCustomerDisplay } from '@/hooks/useLinkedCustomerDisplay';

interface TablePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  table: any;
  onSuccess: () => void;
}

export function TablePaymentModal({ open, onOpenChange, order, table, onSuccess }: TablePaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewOrderData, setPreviewOrderData] = useState<any>(null);
  const hasBroadcastedRef = useRef(false);
  
  // Get linked customer display - includes isLoading state
  const { displayId, isLinked, isLoading, broadcastTablePayment, resetToIdle } = useLinkedCustomerDisplay();

  // Broadcast payment_pending when modal opens AND hook is ready
  useEffect(() => {
    // Only broadcast once per modal open
    if (!open) {
      hasBroadcastedRef.current = false;
      return;
    }
    
    // Already broadcasted for this modal open
    if (hasBroadcastedRef.current) {
      return;
    }
    
    // Don't wait for hook - broadcast directly to the display
    const broadcastPaymentPending = async () => {
      hasBroadcastedRef.current = true;
      
      // Get the display directly from database
      const { data: displayData } = await supabase
        .from('pos_displays')
        .select('display_id')
        .eq('active', true)
        .order('last_activity', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const targetDisplayId = displayData?.display_id || displayId;
      
      if (!targetDisplayId) {
        console.log('📺 [TablePayment] No display found for broadcast');
        return;
      }
      
      console.log('📺 [TablePayment] Broadcasting payment_pending to:', targetDisplayId);
      
      // Fetch order items for display
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          *,
          tables!table_id(label),
          order_items(
            *,
            menu_items(id, name)
          )
        `)
        .eq('id', order.id)
        .single();
      
      if (orderData) {
        const orderItems = (orderData.order_items || []).map((item: any) => ({
          name: item.menu_items?.name || 'Unknown Item',
          quantity: item.quantity,
          price: (item.unit_price || 0) * item.quantity,
          modifiers: item.modifiers ? Object.keys(item.modifiers) : [],
        }));
        
        // Broadcast directly to customer_display_sessions
        const { error } = await supabase
          .from('customer_display_sessions')
          .upsert({
            session_id: targetDisplayId,
            mode: 'payment_pending',
            table_label: orderData.tables?.label || table?.label,
            order_items: orderItems,
            subtotal: orderData.subtotal || 0,
            tax: orderData.tax || 0,
            discount: orderData.discount || 0,
            total: orderData.total || 0,
            order_id: order.id,
            last_activity: new Date().toISOString(),
          }, { onConflict: 'session_id' });

        if (error) {
          console.error('📺 [TablePayment] ❌ Broadcast failed:', error);
        } else {
          console.log('📺 [TablePayment] ✅ Successfully broadcasted payment_pending');
        }
      }
    };
    
    broadcastPaymentPending();
  }, [open, order.id, table?.label, displayId]);

  const handlePaymentSuccess = async (orderId?: string, paymentMethod?: string, change?: number) => {
    try {
      console.log('💰 Table Payment Success:', { orderId, table, paymentMethod, change });
      
      // Get ALL orders for this table
      const orderIds = table?.current_orders?.map((o: any) => o.id) || [order.id];
      
      // Update ALL orders to completed
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
        })
        .in('id', orderIds);

      if (updateError) throw updateError;

      // Free up the table (only if table exists - takeaway orders won't have a table)
      if (table?.id) {
        await supabase
          .from('tables')
          .update({
            status: 'available',
            current_order_id: null,
            seated_at: null,
          })
          .eq('id', table.id);
      }

      // Fetch order data and organization settings for customer receipt
      if (orderId) {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            tables!table_id(label),
            order_items(
              *,
              menu_items(id, name, station_id)
            )
          `)
          .eq('id', orderId)
          .single();
        
        if (!orderError && orderData) {
          // Prepare order items for customer display
          const orderItems = (orderData.order_items || []).map((item: any) => ({
            name: item.menu_items?.name || 'Unknown Item',
            quantity: item.quantity,
            price: (item.unit_price || 0) * item.quantity,
            modifiers: item.modifiers ? Object.keys(item.modifiers) : [],
          }));
          
          // Broadcast complete to customer display
          if (isLinked && displayId) {
            await broadcastTablePayment(displayId, {
              mode: 'complete',
              tableLabel: orderData.tables?.label || table?.label,
              orderItems,
              subtotal: orderData.subtotal || 0,
              tax: orderData.tax || 0,
              total: orderData.total || 0,
              change: change || 0,
              paymentMethod: paymentMethod || 'cash',
              orderId,
            });
            console.log('📺 Broadcasted complete to customer display');
            
            // Auto-reset to idle after 10 seconds
            setTimeout(() => {
              if (displayId) {
                resetToIdle(displayId);
                console.log('📺 Reset customer display to idle');
              }
            }, 10000);
          }
          
          // Fetch organization details
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name, address, phone')
            .eq('id', orderData.organization_id)
            .single();
          
          // Prepare 80mm customer receipt data
          const receiptData = {
            restaurantName: orgData?.name || 'Restaurant',
            address: orgData?.address || '',
            phone: orgData?.phone || '',
            orderNumber: orderId.substring(0, 8).toUpperCase(),
            tableLabel: orderData.tables?.label || undefined,
            orderType: orderData.order_type?.replace('_', ' ').toUpperCase() || 'DINE IN',
            timestamp: new Date(orderData.paid_at || new Date()),
            items: orderItems.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              modifiers: item.modifiers,
            })),
            subtotal: orderData.subtotal || 0,
            tax: orderData.tax || 0,
            total: orderData.total || 0,
            paymentMethod: paymentMethod || 'Cash',
            cashReceived: undefined,
            changeGiven: change,
            cashier: 'Cashier'
          };
          
          // Try QZ Tray first, fallback to browser print
          const configuredPrinter = getConfiguredPrinterName();
          const settings = getCashDrawerSettings();
          const paperSize = settings.paperSize || '80mm';
          
          if (configuredPrinter) {
            // Build plain text receipt for ESC/POS based on paper size
            const receiptParams = {
              orgName: receiptData.restaurantName,
              branchAddress: receiptData.address,
              order: {
                id: orderId,
                order_number: receiptData.orderNumber,
                paid_at: receiptData.timestamp.toISOString(),
                subtotal: receiptData.subtotal,
                tax: receiptData.tax,
                total: receiptData.total,
                tables: { label: receiptData.tableLabel },
                order_items: receiptData.items.map(item => ({
                  name: item.name,
                  quantity: item.quantity,
                  total_price: item.price,
                })),
              },
              paymentMethod: receiptData.paymentMethod,
              cashReceived: receiptData.cashReceived,
              changeGiven: receiptData.changeGiven,
            };
            
            const receiptText = paperSize === '58mm' 
              ? buildReceiptText58mm(receiptParams)
              : buildReceiptText80mm(receiptParams);
            
            // Print in background (non-blocking)
            qzPrintReceiptEscpos({
              printerName: configuredPrinter,
              receiptText,
              cut: true,
              openDrawer: false,
            })
              .then(() => {
                console.log(`✅ Receipt printed via QZ Tray (${paperSize})`);
                toast({
                  title: 'Receipt Printed',
                  description: 'Receipt sent to printer successfully',
                });
              })
              .catch((qzError) => {
                console.warn('⚠️ QZ Tray print failed:', qzError);
                toast({
                  variant: 'destructive',
                  title: 'Print Failed',
                  description: 'Could not print receipt. Try browser print.',
                });
              });
          } else {
            // No QZ printer configured, use browser print
            const { BrowserPrintService } = await import('@/lib/print/BrowserPrintService');
            await BrowserPrintService.print80mmReceipt(receiptData);
          }
          
          // Also set preview data for modal
          console.log('✅ Setting preview data for table payment:', orderData);
          setPreviewOrderData({
            orderId: orderId,
            orderNumber: orderId.substring(0, 8),
            items: orderData.order_items || [],
            subtotal: orderData.subtotal,
            tax: orderData.tax,
            total: orderData.total,
            timestamp: orderData.paid_at,
          });
          setShowPrintPreview(true);
        } else {
          console.error('❌ Failed to fetch order for receipt:', orderError);
        }
      }

      const orderCount = table?.current_orders?.length || 1;
      toast({
        title: 'Payment Complete',
        description: table?.label 
          ? `Table ${table.label} is now available${orderCount > 1 ? ` (${orderCount} orders paid)` : ''}`
          : `Order paid successfully${orderCount > 1 ? ` (${orderCount} orders)` : ''}`,
      });

      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['today-metrics'] });
      onSuccess();
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to complete payment',
        description: error.message,
      });
    }
  };

  // Calculate combined total if multiple orders
  const combinedTotal = table?.current_orders?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || order.total;

  return (
    <>
      <PaymentModal
        open={open}
        onOpenChange={onOpenChange}
        orderId={order.id}
        orderNumber={order.id.slice(0, 8)}
        total={combinedTotal}
        onPaymentSuccess={handlePaymentSuccess}
      />
      
      {previewOrderData && (
        <PrintPreviewModal
          open={showPrintPreview}
          onOpenChange={setShowPrintPreview}
          mode="customer"
          orderData={previewOrderData}
          onSendToPrinter={() => {
            setShowPrintPreview(false);
          }}
        />
      )}
    </>
  );
}
