import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore } from '@/lib/store/cart';
import { PromotionEvaluator } from '@/lib/promotions/evaluator';
import { useEffect } from 'react';

export function usePromotions() {
  const { items, getSubtotal, applyPromotions, clearPromotions } = useCartStore();
  
  // Fetch active promotions
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false });
      
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
