import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, CreditCard, Nfc, UtensilsCrossed } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: Array<{ name: string; price: number }>;
}

interface OrderDisplayProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  nfcCardUid?: string;
  tableLabel?: string;
  roundingAdjustment?: number;
}

// Round to nearest 10 sen
const roundToNearest10Sen = (amount: number): number => {
  return Math.round(amount * 10) / 10;
};

export function OrderDisplay({ 
  items, 
  subtotal, 
  tax, 
  discount, 
  total, 
  nfcCardUid, 
  tableLabel,
  roundingAdjustment 
}: OrderDisplayProps) {
  const roundedTotal = roundToNearest10Sen(total);
  const rounding = roundingAdjustment ?? (roundedTotal - total);
  
  // Determine layout based on item count
  const itemCount = items.length;
  const useCompactMode = itemCount > 8;
  const useTwoColumns = itemCount > 4;
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-primary/5 p-4 overflow-hidden">
      {/* Header with ZeniPOS branding */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img 
            src="/logos/zenipos-full-color.svg" 
            alt="ZeniPOS" 
            className="h-8 w-auto"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {tableLabel && (
            <Badge variant="secondary" className="px-2 py-1 text-sm">
              <UtensilsCrossed className="w-3 h-3 mr-1" />
              {tableLabel}
            </Badge>
          )}
          {nfcCardUid && (
            <Badge variant="outline" className="px-2 py-1 text-sm bg-primary/10 border-primary">
              <Nfc className="w-3 h-3 mr-1" />
              {nfcCardUid}
            </Badge>
          )}
        </div>
      </div>

      {/* Order Title */}
      <div className="mb-2 flex-shrink-0">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          Your Order
        </h1>
        <p className="text-sm text-muted-foreground">
          {items.length > 0 ? `${items.length} item${items.length > 1 ? 's' : ''}` : 'No items yet'}
        </p>
      </div>

      {/* Items List - Scrollable with auto-columns */}
      <Card className="flex-1 p-3 overflow-hidden min-h-0">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mb-3" />
              <p className="text-lg text-muted-foreground">
                Your cart is empty
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Items will appear here
              </p>
            </motion.div>
          ) : (
            <div 
              className={`h-full overflow-y-auto pr-1 ${
                useTwoColumns 
                  ? 'grid grid-cols-2 gap-2 auto-rows-min content-start' 
                  : 'flex flex-col gap-2'
              }`}
            >
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.98 }}
                  transition={{ delay: index * 0.02, type: "spring", stiffness: 400, damping: 30 }}
                  className={`flex items-start justify-between rounded-lg bg-card/50 border transition-colors ${
                    useCompactMode ? 'p-2' : 'p-3'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`font-bold flex-shrink-0 ${useCompactMode ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-0.5'}`}
                      >
                        {item.quantity}×
                      </Badge>
                      <span className={`font-medium text-foreground truncate ${useCompactMode ? 'text-sm' : 'text-base'}`}>
                        {item.name}
                      </span>
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && !useCompactMode && (
                      <div className="ml-8 mt-1 space-y-0.5">
                        {item.modifiers.slice(0, 2).map((mod, i) => (
                          <p key={i} className="text-xs text-muted-foreground truncate">
                            + {mod.name}
                            {mod.price > 0 && (
                              <span className="ml-1 text-primary">+RM{mod.price.toFixed(2)}</span>
                            )}
                          </p>
                        ))}
                        {item.modifiers.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{item.modifiers.length - 2} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`font-bold text-primary ${useCompactMode ? 'text-sm' : 'text-base'}`}>
                      RM{(item.price * item.quantity).toFixed(2)}
                    </p>
                    {item.quantity > 1 && !useCompactMode && (
                      <p className="text-xs text-muted-foreground">
                        @RM{item.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </Card>

      {/* Totals Summary - Compact */}
      <Card className="mt-3 p-4 bg-gradient-to-br from-card to-primary/5 flex-shrink-0">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground font-medium">
              RM {subtotal.toFixed(2)}
            </span>
          </div>
          
          {discount > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-between text-sm"
            >
              <span className="text-muted-foreground">Discount</span>
              <span className="text-green-600 font-medium">
                -RM {discount.toFixed(2)}
              </span>
            </motion.div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (6%)</span>
            <span className="text-foreground font-medium">
              RM {tax.toFixed(2)}
            </span>
          </div>

          {/* Rounding adjustment display */}
          {Math.abs(rounding) > 0.001 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Rounding</span>
              <span className={rounding >= 0 ? "text-muted-foreground" : "text-green-600"}>
                {rounding >= 0 ? '+' : ''}{rounding.toFixed(2)}
              </span>
            </div>
          )}
          
          <Separator className="my-2" />
          
          <motion.div 
            key={roundedTotal}
            initial={{ scale: 1.02 }}
            animate={{ scale: 1 }}
            className="flex justify-between items-center pt-1"
          >
            <span className="text-lg font-bold text-foreground">Total</span>
            <span className="text-2xl font-bold text-primary">
              RM {roundedTotal.toFixed(2)}
            </span>
          </motion.div>

          {/* Payment reminder - more compact */}
          <div className="pt-2 border-t mt-2 flex items-center justify-center gap-2 text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <p className="text-xs">
              Complete payment with cashier
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
