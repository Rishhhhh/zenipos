import { ResponsiveModal } from "@/components/pos/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShoppingCart, MapPin, Package, Edit, CheckCircle2, Tag } from "lucide-react";
import type { CartItem } from "@/lib/store/cart";
import type { EvaluationResult } from "@/lib/promotions/evaluator";
import { useState } from "react";

interface OrderConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  appliedPromotions: EvaluationResult[];
  tableName?: string;
  orderType: 'dine_in' | 'takeaway';
  onConfirm: (orderNotes?: string) => void;
  onEdit: () => void;
}

export function OrderConfirmationModal({
  open,
  onOpenChange,
  items,
  subtotal,
  tax,
  total,
  discount,
  appliedPromotions,
  tableName,
  orderType,
  onConfirm,
  onEdit,
}: OrderConfirmationModalProps) {
  const [orderNotes, setOrderNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(orderNotes || undefined);
    setOrderNotes(""); // Reset for next order
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Confirm Order"
      description="Review your order before sending to the kitchen"
      side="bottom"
      size="lg"
      className="max-h-[90vh]"
    >
      <div className="flex flex-col max-h-[calc(90vh-140px)]">
        {/* Order Info Header - Fixed */}
        <div className="flex-shrink-0 flex items-center gap-3 py-3 border-b">
          <Badge variant="secondary" className="text-base px-3 py-1.5">
            {orderType === 'takeaway' ? (
              <>
                <Package className="h-4 w-4 mr-2" />
                Takeaway
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Table {tableName || '...'}
              </>
            )}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Items List - Scrollable with constrained height */}
        <ScrollArea className="flex-1 max-h-[35vh] min-h-[200px]">
          <div className="space-y-2 pr-4 py-3">
            {items.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs px-2">
                        {item.quantity}x
                      </Badge>
                      <h4 className="font-medium text-foreground">{item.name}</h4>
                    </div>
                    
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1 ml-9">
                        {item.modifiers.map((m, idx) => (
                          <div key={idx}>+ {m.name}</div>
                        ))}
                      </div>
                    )}
                    
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1 ml-9 italic">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      RM {(item.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @ RM {item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Order Notes - Fixed */}
        <div className="flex-shrink-0 py-3 border-t">
          <Label htmlFor="order-notes">Special Instructions (Optional)</Label>
          <Textarea
            id="order-notes"
            placeholder="e.g., No onions, extra sauce, allergies..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Price Summary - Fixed */}
        <div className="flex-shrink-0 space-y-2 py-3 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">RM {subtotal.toFixed(2)}</span>
          </div>

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

          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span>RM {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons - Fixed */}
        <div className="flex-shrink-0 flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onEdit}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Order
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-success hover:bg-success/90 text-white"
            size="lg"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Confirm & Send to Kitchen
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
