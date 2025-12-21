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
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background/95 to-primary/5 p-8">
      {/* Header with branding area */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <ShoppingCart className="w-10 h-10 text-primary" />
            Your Order
          </h1>
          <div className="flex items-center gap-3">
            {tableLabel && (
              <Badge variant="secondary" className="px-4 py-2 text-lg">
                <UtensilsCrossed className="w-4 h-4 mr-2" />
                {tableLabel}
              </Badge>
            )}
            {nfcCardUid && (
              <Badge variant="outline" className="px-4 py-2 text-lg bg-primary/10 border-primary">
                <Nfc className="w-5 h-5 mr-2" />
                {nfcCardUid}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xl text-muted-foreground">
          Please review your items
        </p>
      </div>

      {/* Items List */}
      <Card className="flex-1 p-6 overflow-auto">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <ShoppingCart className="w-24 h-24 text-muted-foreground/50 mb-4" />
              <p className="text-2xl text-muted-foreground">
                Your cart is empty
              </p>
              <p className="text-lg text-muted-foreground/70 mt-2">
                Items will appear here as they're added
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-start justify-between p-4 rounded-lg bg-card hover:bg-accent/5 transition-colors border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Badge variant="secondary" className="text-lg px-3 py-1 font-bold">
                        {item.quantity}×
                      </Badge>
                      <h3 className="text-2xl font-semibold text-foreground">
                        {item.name}
                      </h3>
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="ml-14 mt-2 space-y-1">
                        {item.modifiers.map((mod, i) => (
                          <p key={i} className="text-lg text-muted-foreground">
                            + {mod.name}
                            {mod.price > 0 && (
                              <span className="ml-2 text-primary">
                                +RM {mod.price.toFixed(2)}
                              </span>
                            )}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      RM {(item.price * item.quantity).toFixed(2)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-sm text-muted-foreground">
                        RM {item.price.toFixed(2)} each
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </Card>

      {/* Totals Summary */}
      <Card className="mt-6 p-8 bg-gradient-to-br from-card to-primary/5">
        <div className="space-y-4">
          <div className="flex justify-between text-2xl">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground font-semibold">
              RM {subtotal.toFixed(2)}
            </span>
          </div>
          
          {discount > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-between text-2xl"
            >
              <span className="text-muted-foreground">Discount</span>
              <span className="text-green-600 font-semibold">
                -RM {discount.toFixed(2)}
              </span>
            </motion.div>
          )}
          
          <div className="flex justify-between text-2xl">
            <span className="text-muted-foreground">Tax (6%)</span>
            <span className="text-foreground font-semibold">
              RM {tax.toFixed(2)}
            </span>
          </div>

          {/* Rounding adjustment display */}
          {Math.abs(rounding) > 0.001 && (
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Rounding</span>
              <span className={rounding >= 0 ? "text-muted-foreground" : "text-green-600"}>
                {rounding >= 0 ? '+' : ''}{rounding.toFixed(2)}
              </span>
            </div>
          )}
          
          <Separator className="my-3" />
          
          <motion.div 
            key={roundedTotal}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className="flex justify-between text-4xl font-bold pt-2"
          >
            <span className="text-foreground">Total</span>
            <span className="text-primary">
              RM {roundedTotal.toFixed(2)}
            </span>
          </motion.div>

          {/* Payment reminder */}
          <div className="mt-6 pt-4 border-t flex items-center justify-center gap-3 text-muted-foreground">
            <CreditCard className="w-6 h-6" />
            <p className="text-lg">
              Complete payment with cashier when ready
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
