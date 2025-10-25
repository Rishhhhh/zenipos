import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useCartStore } from "@/lib/store/cart";
import { QrCode } from "lucide-react";

export default function CustomerScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { items, getSubtotal, getTax, getTotal } = useCartStore();
  const [tipPercent, setTipPercent] = useState(15);
  const [customTip, setCustomTip] = useState(0);

  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to realtime updates for this session
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Order updated:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const subtotal = getSubtotal();
  const tax = getTax();
  const tip = customTip || (subtotal * tipPercent / 100);
  const total = subtotal + tax + tip;

  return (
    <div className="kiosk-layout bg-accent/20 p-8">
      <div className="max-w-2xl mx-auto h-full flex flex-col">
        <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
          Your Order
        </h1>

        {/* Cart Items */}
        <Card className="flex-1 p-6 mb-6 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-xl">Waiting for order...</p>
              <Skeleton className="h-64 w-64 mt-4" />
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center pb-3 border-b">
                  <div>
                    <h3 className="font-medium text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ${item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Tip Selection */}
        {items.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Add Tip</h2>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[15, 18, 20].map(percent => (
                <Button
                  key={percent}
                  variant={tipPercent === percent && !customTip ? "default" : "outline"}
                  onClick={() => {
                    setTipPercent(percent);
                    setCustomTip(0);
                  }}
                >
                  {percent}%
                </Button>
              ))}
              <Button
                variant={customTip > 0 ? "default" : "outline"}
                onClick={() => {
                  const tip = prompt("Enter custom tip amount:");
                  if (tip) setCustomTip(Number(tip));
                }}
              >
                Custom
              </Button>
            </div>
          </Card>
        )}

        {/* Total Summary */}
        {items.length > 0 && (
          <Card className="p-6 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">Tip</span>
                <span className="font-medium">${tip.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-2xl font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* QR Payment Placeholder */}
        {items.length > 0 && (
          <Card className="p-8 flex flex-col items-center">
            <QrCode className="h-48 w-48 text-primary mb-4" />
            <p className="text-lg font-medium text-foreground">Scan to Pay</p>
            <p className="text-sm text-muted-foreground">QR payment coming soon</p>
          </Card>
        )}
      </div>
    </div>
  );
}
