import { Tables } from '@/integrations/supabase/types';
import { CartItem } from '@/lib/store/cart';

export type Promotion = Tables<'promotions'>;

export interface EvaluationResult {
  promotion: Promotion;
  discount: number;
  appliedItems?: string[];
  message: string;
}

export interface EvaluationContext {
  items: CartItem[];
  subtotal: number;
  currentTime: Date;
  customerId?: string;
}

export class PromotionEvaluator {
  /**
   * Evaluate all active promotions and return applicable discounts
   */
  static evaluatePromotions(
    promotions: Promotion[],
    context: EvaluationContext
  ): EvaluationResult[] {
    const results: EvaluationResult[] = [];
    
    // Sort by priority (descending)
    const sorted = [...promotions].sort((a, b) => b.priority - a.priority);
    
    for (const promo of sorted) {
      // Check time validity
      if (!this.isTimeValid(promo, context.currentTime)) continue;
      
      // Evaluate based on type
      const result = this.evaluatePromotion(promo, context);
      if (result) {
        results.push(result);
        
        // If not stackable, stop after first match
        if (!promo.stackable) break;
      }
    }
    
    return results;
  }
  
  /**
   * Check if promotion is valid at current time
   */
  private static isTimeValid(promo: Promotion, currentTime: Date): boolean {
    const now = currentTime.getTime();
    
    if (promo.start_date && new Date(promo.start_date).getTime() > now) {
      return false;
    }
    
    if (promo.end_date && new Date(promo.end_date).getTime() < now) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Evaluate specific promotion type
   */
  private static evaluatePromotion(
    promo: Promotion,
    context: EvaluationContext
  ): EvaluationResult | null {
    switch (promo.type) {
      case 'BUY_X_GET_Y':
        return this.evaluateBuyXGetY(promo, context);
      case 'PERCENT_OFF':
        return this.evaluatePercentOff(promo, context);
      case 'TIME_RANGE_DISCOUNT':
        return this.evaluateTimeRangeDiscount(promo, context);
      case 'HAPPY_HOUR':
        return this.evaluateHappyHour(promo, context);
      default:
        return null;
    }
  }
  
  /**
   * Buy X Get Y Free
   * Rules: { buy_quantity: 2, get_quantity: 1, discount_type: "cheapest_free" }
   */
  private static evaluateBuyXGetY(
    promo: Promotion,
    context: EvaluationContext
  ): EvaluationResult | null {
    const rules = promo.rules as any;
    const buyQty = rules.buy_quantity || 2;
    const getQty = rules.get_quantity || 1;
    
    const totalQty = context.items.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalQty < buyQty) return null;
    
    // Find cheapest items to discount
    const sortedItems = [...context.items].sort((a, b) => a.price - b.price);
    let discount = 0;
    let remaining = getQty;
    const appliedItems: string[] = [];
    
    for (const item of sortedItems) {
      if (remaining <= 0) break;
      const qtyToDiscount = Math.min(item.quantity, remaining);
      discount += item.price * qtyToDiscount;
      appliedItems.push(item.id);
      remaining -= qtyToDiscount;
    }
    
    return {
      promotion: promo,
      discount,
      appliedItems,
      message: `Buy ${buyQty} Get ${getQty} Free`,
    };
  }
  
  /**
   * Percent Off
   * Rules: { discount_percent: 20, min_amount?: 50 }
   */
  private static evaluatePercentOff(
    promo: Promotion,
    context: EvaluationContext
  ): EvaluationResult | null {
    const rules = promo.rules as any;
    const percent = rules.discount_percent || 0;
    const minAmount = rules.min_amount || 0;
    
    if (context.subtotal < minAmount) return null;
    
    const discount = context.subtotal * (percent / 100);
    
    return {
      promotion: promo,
      discount,
      message: `${percent}% Off`,
    };
  }
  
  /**
   * Time Range Discount
   * Rules: { days?: [0,6], discount_percent: 15, start_time?: "21:00", end_time?: "23:00" }
   */
  private static evaluateTimeRangeDiscount(
    promo: Promotion,
    context: EvaluationContext
  ): EvaluationResult | null {
    const rules = promo.rules as any;
    const currentDay = context.currentTime.getDay();
    const currentHour = context.currentTime.getHours();
    const currentMinute = context.currentTime.getMinutes();
    
    // Check day of week
    if (rules.days && !rules.days.includes(currentDay)) return null;
    
    // Check time range
    if (rules.start_time) {
      const [startHour, startMin] = rules.start_time.split(':').map(Number);
      if (currentHour < startHour || (currentHour === startHour && currentMinute < startMin)) {
        return null;
      }
    }
    
    if (rules.end_time) {
      const [endHour, endMin] = rules.end_time.split(':').map(Number);
      if (currentHour > endHour || (currentHour === endHour && currentMinute > endMin)) {
        return null;
      }
    }
    
    const percent = rules.discount_percent || 0;
    const discount = context.subtotal * (percent / 100);
    
    return {
      promotion: promo,
      discount,
      message: `${percent}% Time Discount`,
    };
  }
  
  /**
   * Happy Hour (combines time range + percent)
   * Rules: { start_time: "21:00", end_time: "23:00", discount_percent: 20 }
   */
  private static evaluateHappyHour(
    promo: Promotion,
    context: EvaluationContext
  ): EvaluationResult | null {
    // Reuse time range logic
    return this.evaluateTimeRangeDiscount(promo, context);
  }
}
