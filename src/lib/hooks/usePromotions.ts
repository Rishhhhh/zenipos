import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore } from '@/lib/store/cart';
import { PromotionEvaluator } from '@/lib/promotions/evaluator';
import { useEffect } from 'react';
import { useBranch } from '@/contexts/BranchContext';

export function usePromotions() {
  const { items, getSubtotal, applyPromotions, clearPromotions } = useCartStore();
  const { currentBranch } = useBranch();
  
  // Fetch active promotions filtered by branch
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', 'active', currentBranch?.id],
    queryFn: async () => {
      let query = supabase
        .from('promotions')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false });
      
      // Filter by branch if available
      if (currentBranch?.id) {
        query = query.or(`branch_id.eq.${currentBranch.id},branch_id.is.null`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 60000, // Cache for 1 minute
  });
  
  // Auto-evaluate promotions when cart or promotions change
  useEffect(() => {
    if (!promotions || items.length === 0) {
      clearPromotions();
      return;
    }
    
    const results = PromotionEvaluator.evaluatePromotions(promotions, {
      items,
      subtotal: getSubtotal(),
      currentTime: new Date(),
    });
    
    applyPromotions(results);
  }, [promotions, items, getSubtotal, applyPromotions, clearPromotions]);
  
  return {
    promotions,
    isLoading,
  };
}
