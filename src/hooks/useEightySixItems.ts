import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEightySixItems(branchId?: string) {
  const queryClient = useQueryClient();

  const { data: eightySixItems = [] } = useQuery({
    queryKey: ['eighty-six-items', branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_eighty_six_items', {
        branch_id_param: branchId || null,
      });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Compute set of 86'd item IDs
  const eightySixedItemIds = useMemo(() => {
    return new Set(eightySixItems.map((item: any) => item.menu_item_id));
  }, [eightySixItems]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('eighty-six-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'eighty_six_items',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['eighty-six-items'] });
          queryClient.invalidateQueries({ queryKey: ['menu_items'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const isEightySixed = (menuItemId: string) => {
    return eightySixedItemIds.has(menuItemId);
  };

  const getEightySixInfo = (menuItemId: string) => {
    return eightySixItems.find((item: any) => item.menu_item_id === menuItemId);
  };

  return {
    eightySixItems,
    eightySixedItemIds,
    isEightySixed,
    getEightySixInfo,
  };
}
