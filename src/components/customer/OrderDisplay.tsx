import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
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
}

export function OrderDisplay({ items, subtotal, tax, discount, total }: OrderDisplayProps) {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background/95 to-primary/5 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
          <ShoppingCart className="w-10 h-10 text-primary" />
          Your Order
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Please review your items
        </p>
      </div>

      <Card className="flex-1 p-6 overflow-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingCart className="w-24 h-24 text-muted-foreground/50 mb-4" />
            <p className="text-2xl text-muted-foreground">
              Your cart is empty
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start justify-between p-4 rounded-lg bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
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
                              +${mod.price.toFixed(2)}
                            </span>
                          )}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-sm text-muted-foreground">
                      ${item.price.toFixed(2)} each
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-6 p-6">
        <div className="space-y-3">
          <div className="flex justify-between text-xl">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground font-semibold">
              ${subtotal.toFixed(2)}
            </span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between text-xl">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-green-600 font-semibold">
                -${discount.toFixed(2)}
              </span>
            </div>
          )}
          
          <div className="flex justify-between text-xl">
            <span className="text-muted-foreground">Tax</span>
            <span className="text-foreground font-semibold">
              ${tax.toFixed(2)}
            </span>
          </div>
          
          <Separator className="my-2" />
          
          <div className="flex justify-between text-3xl font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-primary">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
