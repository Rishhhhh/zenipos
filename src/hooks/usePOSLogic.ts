import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/lib/store/cart';
import { useQueryConfig } from '@/hooks/useQueryConfig';
import { PrintRoutingService } from '@/lib/print/PrintRoutingService';
import { useSpeedMode } from '@/hooks/useSpeedMode';

/**
 * Core POS business logic and data fetching
 * Handles queries, mutations, and state for orders/menu/tables
 */
export function usePOSLogic() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryConfig = useQueryConfig();
  const { speedMode } = useSpeedMode();
  
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

  // Fetch menu items with modifier prefetching
  const menuItemsQuery = useQuery({
    queryKey: ['menu_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('in_stock', true);
      if (error) throw error;
      
      // PREFETCH: Load modifiers for all items in background
      if (data && data.length > 0) {
        data.forEach((item) => {
          queryClient.prefetchQuery({
            queryKey: ['category-modifiers', item.id],
            queryFn: async () => {
              const { data: itemData } = await supabase
                .from('menu_items')
                .select(`
                  category_id,
                  menu_categories!inner (
                    category_modifier_groups (
                      sort_order,
                      modifier_groups (
                        id, name, min_selections, max_selections,
                        modifiers (id, name, price)
                      )
                    )
                  )
                `)
                .eq('id', item.id)
                .single();
              
              const groups = itemData?.menu_categories?.category_modifier_groups
                ?.map((cmg: any) => cmg.modifier_groups)
                ?.filter((g: any) => g !== null) || [];
              
              return groups;
            },
            staleTime: 5 * 60 * 1000,
          });
        });
      }
      
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
  // Speed Mode: Set order status to 'delivered' and skip KDS
  const confirmAndSendOrder = useMutation({
    mutationFn: async (params: { orderNotes?: string; isSpeedMode?: boolean }) => {
      const { orderNotes, isSpeedMode = speedMode } = params;
      
      console.log('🔵 Starting order creation...', {
        items: items.length,
        table_id: useCartStore.getState().table_id,
        order_type: useCartStore.getState().order_type,
        speedMode: isSpeedMode,
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

      // Check for existing active order on table (add-on functionality)
      if (cartState.table_id && cartState.order_type === 'dine_in') {
        const { data: existingOrder, error: checkError } = await supabase
          .from('orders')
          .select('id, subtotal, tax, total, status, organization_id, branch_id')
          .eq('table_id', cartState.table_id)
          .in('status', ['pending', 'preparing', 'delivered'])
          .maybeSingle();

        if (!checkError && existingOrder) {
          console.log('🔄 Found existing order, adding items:', existingOrder.id);

          // Insert new items into existing order
          // Speed Mode: Set status to 'delivered' directly
          const newOrderItems = items.map((item) => ({
            order_id: existingOrder.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            unit_price: item.price,
            notes: item.notes || null,
            modifiers: item.modifiers as any || [],
            status: isSpeedMode ? 'delivered' : 'kitchen_queue',
            organization_id: existingOrder.organization_id,
          }));

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(newOrderItems);

          if (itemsError) throw itemsError;

          // Recalculate order totals
          const newSubtotal = existingOrder.subtotal + subtotal;
          const newTax = existingOrder.tax + tax;
          const newTotal = existingOrder.total + total;

          const { error: updateError } = await supabase
            .from('orders')
            .update({
              subtotal: newSubtotal,
              tax: newTax,
              total: newTotal,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingOrder.id);

          if (updateError) throw updateError;

          // Fetch updated order for return
          const { data: updatedOrder, error: fetchError } = await supabase
            .from('orders')
            .select()
            .eq('id', existingOrder.id)
            .single();

          if (fetchError || !updatedOrder) {
            throw fetchError || new Error('Order not found after update');
          }

          // Log add-on to audit
          await supabase.from('audit_log').insert({
            actor: user.id,
            action: 'add_items_to_order',
            entity: 'orders',
            entity_id: existingOrder.id,
            diff: { 
              added_items: items.length, 
              new_total: newTotal,
              previous_total: existingOrder.total,
            },
          });

          console.log('✅ Items added to existing order:', existingOrder.id);
          return updatedOrder;
        }
      }

      // Create new order (existing logic)
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
        p_branch_id: employee.branch_id,
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

      console.log('📤 Creating NEW order via RPC:', rpcParams);

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
      
      // AUTO-PRINT: Route order to station printers (FIRE-AND-FORGET for speed)
      // Non-blocking: Don't await, just fire off the print job
      Promise.resolve(PrintRoutingService.routeOrder(order.id)).catch((printError) => {
        console.error('⚠️ Print routing failed:', printError);
      });

      // Update table status if dine-in (also fire-and-forget)
      if (table_id) {
        (async () => {
          try {
            await supabase
              .from('tables')
              .update({
                status: 'occupied',
                current_order_id: order.id,
                seated_at: new Date().toISOString(),
                last_order_at: new Date().toISOString(),
              })
              .eq('id', table_id);
            console.log('✅ Table status updated');
          } catch (err) {
            console.error('⚠️ Table update failed:', err);
          }
        })();
      }

      toast({
        title: speedMode ? "Order ready for payment!" : "Order sent to Kitchen",
        description: `Order #${order.id.substring(0, 8)} - ${items.length} items`,
      });

      // Close confirmation modal
      setShowOrderConfirmation(false);
      
      // Speed Mode: Reset for new order (clears items/table but keeps NFC card)
      // This triggers table selection prompt for next order
      if (speedMode) {
        useCartStore.getState().resetForNewOrder();
      } else {
        clearCartItems();
      }
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
    pendingItem,
    setPendingItem,
    previewOrderData,
    setPreviewOrderData,
  };
}
