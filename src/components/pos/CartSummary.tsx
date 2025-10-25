import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, Send, ShoppingCart } from "lucide-react";
import type { CartItem } from "@/lib/store/cart";

interface CartSummaryProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onSendToKDS: () => void;
  isSending: boolean;
}

export function CartSummary({
  items,
  subtotal,
  tax,
  total,
  onUpdateQuantity,
  onSendToKDS,
  isSending,
}: CartSummaryProps) {
  return (
    <div className="h-full bg-card p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Cart</h2>
      
      <ScrollArea className="flex-1 mb-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ShoppingCart className="h-16 w-16 mb-4 opacity-50" />
            <p>Cart is empty</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <Card key={item.id} className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 touch-target"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 touch-target"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax (8%)</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        
        <Button
          className="w-full mt-4 touch-target"
          size="lg"
          onClick={onSendToKDS}
          disabled={items.length === 0 || isSending}
        >
          <Send className="h-4 w-4 mr-2" />
          {isSending ? 'Sending...' : 'Send to KDS'}
        </Button>
      </div>
    </div>
  );
}
