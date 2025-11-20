import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/lib/store/cart';
import { useQueryConfig } from '@/hooks/useQueryConfig';
import { PrintRoutingService } from '@/lib/print/PrintRoutingService';

/**
 * Core POS business logic and data fetching
 * Handles queries, mutations, and state for orders/menu/tables
 */
export function usePOSLogic() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryConfig = useQueryConfig();
  
  // Cart store access
  const { 
    items, 
    clearCartItems, 
    getSubtotal, 
    getTax, 
    getTotal, 
    getDiscount,
    appliedPromotions,
    sessionId,
    table_id,
    order_type,
    nfc_card_id
  } = useCartStore();

  // Modal states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [showTableSelect, setShowTableSelect] = useState(false);
  const [showModifierSelect, setShowModifierSelect] = useState(false);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [showLinkDisplay, setShowLinkDisplay] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [showNFCCardSelect, setShowNFCCardSelect] = useState(false);
  const [showOrderTypeSelect, setShowOrderTypeSelect] = useState(false);
  const [pendingItem, setPendingItem] = useState<any>(null);
  const [previewOrderData, setPreviewOrderData] = useState<any>(null);

  // Fetch categories
  const categoriesQuery = useQuery({
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
  const menuItemsQuery = useQuery({
    queryKey: ['menu_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('in_stock', true);
      if (error) throw error;
      return data;
    },
    refetchInterval: queryConfig.refetchInterval.fast,
    staleTime: queryConfig.staleTime.fast,
  });

  // Fetch selected table
  const selectedTableQuery = useQuery({
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

  // Fetch linked customer display
  const linkedDisplayQuery = useQuery({
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

  // Create and send order mutation
  const confirmAndSendOrder = useMutation({
    mutationFn: async (orderNotes?: string) => {
      console.log('🔵 Starting order creation...', {
        items: items.length,
        table_id: useCartStore.getState().table_id,
        order_type: useCartStore.getState().order_type,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's branch_id from employee record
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('branch_id')
        .eq('auth_user_id', user.id)
        .single();

      if (empError || !employee?.branch_id) {
        throw new Error('User branch not found');
      }

      const subtotal = getSubtotal();
      const tax = getTax();
      const discount = getDiscount();
      const total = getTotal();

      const cartState = useCartStore.getState();
      
      const orderItems = items.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.price,
        notes: item.notes || null,
        modifiers: item.modifiers || [],
      }));

      const rpcParams = {
        p_session_id: sessionId,
        p_table_id: cartState.table_id,
        p_order_type: cartState.order_type,
        p_nfc_card_id: cartState.nfc_card_id,
        p_branch_id: employee.branch_id,  // ADDED: Pass user's branch_id
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

      console.log('📤 Creating order via RPC function:', rpcParams);

      const { data: result, error: orderError } = await supabase.rpc('create_order_with_items', rpcParams as any);

      if (orderError) {
        console.error('❌ Order creation failed:', orderError);
        throw orderError;
      }

      console.log('✅ Order created via RPC:', result);

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
      
      // AUTO-PRINT: Route order to station printers
      try {
        await PrintRoutingService.routeOrder(order.id);
        console.log('✅ Order routed to printers');
      } catch (printError) {
        console.error('⚠️  Print routing failed:', printError);
        // Don't fail the order, just log warning
      }
      
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

      // Orders now start as 'kitchen_queue' from RPC function
      // Auto-progression will handle moving to 'preparing' after 2 minutes
      console.log('📤 Order created with organization_id derived from branch');

      // Update table status if dine-in
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

      toast({
        title: "Order sent to Kitchen",
        description: `Order #${order.id.substring(0, 8)} - ${items.length} items`,
      });

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

  return {
    // Queries
    categories: categoriesQuery.data,
    categoriesLoading: categoriesQuery.isLoading,
    menuItems: menuItemsQuery.data,
    itemsLoading: menuItemsQuery.isLoading,
    selectedTable: selectedTableQuery.data,
    customerDisplayId: linkedDisplayQuery.data || null,
    
    // Mutations
    confirmAndSendOrder,
    
    // Modal states
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
  };
}
