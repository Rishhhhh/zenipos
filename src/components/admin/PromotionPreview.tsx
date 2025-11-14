import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { PromotionEvaluator } from '@/lib/promotions/evaluator';
import type { Tables } from '@/integrations/supabase/types';

type Promotion = Tables<'promotions'>;

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface PromotionPreviewProps {
  promotion: Partial<Promotion>;
}

export function PromotionPreview({ promotion }: PromotionPreviewProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [testTime, setTestTime] = useState(new Date().toISOString().slice(0, 16));

  const addItem = () => {
    if (!itemName || !itemPrice) return;
    
    setCartItems([
      ...cartItems,
      {
        id: Math.random().toString(),
        name: itemName,
        price: parseFloat(itemPrice),
        quantity: parseInt(itemQuantity) || 1,
      },
    ]);
    
    setItemName('');
    setItemPrice('');
    setItemQuantity('1');
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Simulate promotion evaluation
  const simulatePromotion = () => {
    if (!promotion.type) return null;

    const mockPromotion: Promotion = {
      id: 'preview',
      name: promotion.name || 'Preview',
      description: promotion.description || null,
      type: promotion.type as any,
      rules: promotion.rules || {},
      start_date: promotion.start_date || null,
      end_date: promotion.end_date || null,
      active: true,
      priority: promotion.priority || 1,
      stackable: promotion.stackable || false,
      branch_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockCartItems = cartItems.map(item => ({
      id: item.id,
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      modifiers: [],
      notes: null,
    }));

    const results = PromotionEvaluator.evaluatePromotions([mockPromotion], {
      items: mockCartItems,
      subtotal,
      currentTime: new Date(testTime),
    });

    return results[0] || null;
  };

  const result = simulatePromotion();

  return (
    <div className="space-y-6">
      {/* Add Test Items */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Test Cart Items</h3>
        
        <div className="grid grid-cols-12 gap-2 mb-4">
          <div className="col-span-5">
            <Label>Item Name</Label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Burger"
            />
          </div>
          <div className="col-span-3">
            <Label>Price (RM)</Label>
            <Input
              type="number"
              step="0.01"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder="15.00"
            />
          </div>
          <div className="col-span-2">
            <Label>Qty</Label>
            <Input
              type="number"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              placeholder="1"
            />
          </div>
          <div className="col-span-2 flex items-end">
            <Button onClick={addItem} size="sm" className="w-full">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cart Items List */}
        {cartItems.length > 0 ? (
          <div className="space-y-2">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex-1">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    RM {item.price.toFixed(2)} × {item.quantity}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">RM {(item.price * item.quantity).toFixed(2)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t font-semibold">
              <span>Subtotal:</span>
              <span>RM {subtotal.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">Add items to test promotion</p>
        )}
      </Card>

      {/* Test Time */}
      <Card className="p-4">
        <Label>Test Date & Time</Label>
        <Input
          type="datetime-local"
          value={testTime}
          onChange={(e) => setTestTime(e.target.value)}
          className="mt-2"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use this to test time-based promotions
        </p>
      </Card>

      {/* Result */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Promotion Result</h3>
        
        {cartItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Add items to see results</p>
        ) : !result ? (
          <div className="text-center py-8">
            <Badge variant="secondary">Promotion Does Not Apply</Badge>
            <p className="text-sm text-muted-foreground mt-2">
              The current cart does not meet promotion requirements
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status:</span>
              <Badge variant="default">Applied</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Discount Amount:</span>
              <span className="text-lg font-bold text-primary">
                -RM {result.discount.toFixed(2)}
              </span>
            </div>
            
            {result.message && (
              <div className="p-3 bg-muted rounded">
                <p className="text-sm">{result.message}</p>
              </div>
            )}
            
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>RM {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-primary">
                <span>Discount:</span>
                <span>-RM {result.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>RM {(subtotal - result.discount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
