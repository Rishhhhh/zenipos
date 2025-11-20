import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, CreditCard, ShoppingCart, Tag, Trash2, Split } from "lucide-react";
import type { CartItem } from "@/lib/store/cart";
import type { EvaluationResult } from "@/lib/promotions/evaluator";
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { cn } from '@/lib/utils';

interface CartSummaryProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount?: number;
  appliedPromotions?: EvaluationResult[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onVoidItem: (id: string, managerId?: string) => Promise<void>;
  onSendToKDS: () => void;
  onSplitBill?: () => void;
  isSending: boolean;
}

export function CartSummary({
  items,
  subtotal,
  tax,
  total,
  discount = 0,
  appliedPromotions = [],
  onUpdateQuantity,
  onVoidItem,
  onSendToKDS,
  onSplitBill,
  isSending,
}: CartSummaryProps) {
  // No PIN required for pre-order edits - only for post-confirmation modifications
  const { isMobile } = useDeviceDetection();

  // MOBILE: Compact sticky footer layout
  if (isMobile) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-3 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Cart</h2>
        </div>
        
        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto p-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="h-16 w-16 mb-4 opacity-50" />
              <p>Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <Card key={item.id} className="p-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-foreground truncate">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        RM {item.price.toFixed(2)}
                      </p>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.modifiers.map(m => `+ ${m.name}`).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => onVoidItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Checkout Footer */}
        {items.length > 0 && (
          <div className="border-t p-3 space-y-2 flex-shrink-0 bg-card/95 backdrop-blur-sm safe-area-bottom">
            {/* Promotions */}
            {appliedPromotions.length > 0 && (
              <div className="text-xs">
                {appliedPromotions.map((promo, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-success">
                    <Tag className="h-3 w-3" />
                    <span>{promo.promotion.name}: -RM {promo.discount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Totals (compact) */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>RM {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount</span>
                  <span>-RM {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>RM {tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-1 border-t">
                <span>Total</span>
                <span className="text-primary">RM {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons (stacked on mobile) */}
            <div className="flex flex-col gap-2 pt-2">
              {onSplitBill && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSplitBill}
                  className="w-full h-10"
                >
                  <Split className="h-4 w-4 mr-2" />
                  Split Bill
                </Button>
              )}
              <Button
                onClick={onSendToKDS}
                disabled={isSending || items.length === 0}
                className="w-full h-12 text-base font-semibold"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Review Order
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PORTRAIT TABLET & DESKTOP: Full sidebar layout
  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Cart</h2>
      
      {/* Scrollable Cart Items */}
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
                  RM {item.price.toFixed(2)}
                </p>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.modifiers.map(m => `+ ${m.name}`).join(', ')}
                  </div>
                )}
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
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 touch-target text-destructive"
                      onClick={() => onVoidItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* STICKY CHECKOUT - Always Visible */}
      <div className="border-t pt-4 space-y-2 flex-shrink-0 bg-card/95 backdrop-blur-sm">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">RM {subtotal.toFixed(2)}</span>
        </div>
        
        {/* Promotions */}
        {appliedPromotions.length > 0 && (
          <div className="space-y-1">
            {appliedPromotions.map((promo, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="h-3 w-3 text-success" />
                  <span className="text-success font-medium">{promo.message}</span>
                </div>
                <span className="text-success font-medium">
                  -RM {promo.discount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax (8%)</span>
          <span className="font-medium">RM {tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <div className="flex items-center gap-2">
            <span>Total</span>
            {appliedPromotions.length > 0 && (
              <Badge variant="default" className="bg-success text-white">
                Promo Applied
              </Badge>
            )}
          </div>
          <span>RM {total.toFixed(2)}</span>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-2 mt-4">
          {items.length > 1 && onSplitBill && (
            <Button
              variant="outline"
              className="w-full touch-target"
              onClick={onSplitBill}
            >
              <Split className="h-4 w-4 mr-2" />
              Split Bill
            </Button>
          )}
          
          <Button
            className="w-full touch-target"
            size="lg"
            onClick={onSendToKDS}
            disabled={items.length === 0 || isSending}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isSending ? 'Confirming...' : 'Review Order'}
          </Button>
        </div>
      </div>

    </div>
  );
}
