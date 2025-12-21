import { motion } from "framer-motion";
import { ShoppingBag, CreditCard, Loader2 } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifiers?: string[];
}

interface PaymentPendingDisplayProps {
  tableLabel?: string;
  orderItems: OrderItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
}

export function PaymentPendingDisplay({
  tableLabel,
  orderItems,
  subtotal,
  tax,
  discount = 0,
  total,
}: PaymentPendingDisplayProps) {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header with Table Label */}
      <div className="flex-shrink-0 p-6 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"
            >
              <ShoppingBag className="w-7 h-7 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Your Order</h1>
              <p className="text-muted-foreground">Review your items</p>
            </div>
          </div>
          {tableLabel && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-6 py-3 bg-primary rounded-2xl"
            >
              <span className="text-2xl font-bold text-primary-foreground">
                {tableLabel}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Order Items - Scrollable */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-3">
          {orderItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start justify-between p-4 bg-card rounded-xl border shadow-sm"
            >
              <div className="flex items-start gap-4">
                {/* Quantity Badge */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">
                    {item.quantity}×
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-foreground">
                    {item.name}
                  </p>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.modifiers.join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-lg font-semibold text-foreground whitespace-nowrap">
                RM {item.price.toFixed(2)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Summary Section - Fixed at bottom */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="flex-shrink-0 border-t bg-card/80 backdrop-blur-lg"
      >
        <div className="max-w-2xl mx-auto p-6 space-y-4">
          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">RM {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Tax (6%)</span>
              <span className="text-foreground">RM {tax.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-lg text-green-600">
                <span>Discount</span>
                <span>- RM {discount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-dashed" />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-foreground">Total</span>
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.1, 1] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-4xl font-bold text-primary"
            >
              RM {total.toFixed(2)}
            </motion.span>
          </div>

          {/* Processing Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-3 py-4 mt-4 bg-primary/5 rounded-xl border border-primary/20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <CreditCard className="w-6 h-6 text-primary" />
            </motion.div>
            <span className="text-lg font-medium text-primary">
              Proceeding to Payment...
            </span>
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
