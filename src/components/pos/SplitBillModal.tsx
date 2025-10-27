import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { CartItem } from '@/lib/store/cart';
import { Users, Plus, Minus } from 'lucide-react';

interface SplitBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onConfirm: (splits: CartItem[][]) => void;
}

export function SplitBillModal({ open, onOpenChange, items, onConfirm }: SplitBillModalProps) {
  const [numSplits, setNumSplits] = useState(2);
  const [assignments, setAssignments] = useState<Record<string, number>>({});

  const handleAssign = (itemId: string, splitIndex: number) => {
    setAssignments({
      ...assignments,
      [itemId]: splitIndex,
    });
  };

  const getSplitItems = (splitIndex: number): CartItem[] => {
    return items.filter(item => assignments[item.id] === splitIndex);
  };

  const getSplitTotal = (splitIndex: number): number => {
    return getSplitItems(splitIndex).reduce((sum, item) => {
      const modifierPrice = item.modifiers?.reduce((s, m) => s + m.price, 0) || 0;
      return sum + ((item.price + modifierPrice) * item.quantity);
    }, 0);
  };

  const canConfirm = () => {
    // All items must be assigned
    return items.every(item => assignments[item.id] !== undefined);
  };

  const handleConfirm = () => {
    const splits: CartItem[][] = [];
    for (let i = 0; i < numSplits; i++) {
      splits.push(getSplitItems(i));
    }
    onConfirm(splits);
    onOpenChange(false);
  };

  const getUnassignedItems = () => {
    return items.filter(item => assignments[item.id] === undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Split Bill</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Number of Splits Control */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="font-semibold">Number of Bills:</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setNumSplits(Math.max(2, numSplits - 1))}
                  disabled={numSplits <= 2}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {numSplits}
                </Badge>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setNumSplits(Math.min(10, numSplits + 1))}
                  disabled={numSplits >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Unassigned Items */}
          {getUnassignedItems().length > 0 && (
            <Card className="p-4 bg-warning/10 border-warning">
              <h3 className="font-semibold mb-2 text-warning">Unassigned Items</h3>
              <ScrollArea className="max-h-32">
                <div className="space-y-2">
                  {getUnassignedItems().map(item => (
                    <div key={item.id} className="text-sm flex justify-between">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="text-muted-foreground">
                        RM {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}

          {/* Split Bills Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: numSplits }, (_, i) => (
              <Card key={i} className="p-4">
                <div className="mb-3">
                  <Badge className="mb-2">Bill #{i + 1}</Badge>
                  <Separator />
                </div>

                <ScrollArea className="h-48 mb-3">
                  <div className="space-y-2">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className={`p-2 rounded cursor-pointer transition-colors text-xs ${
                          assignments[item.id] === i
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => handleAssign(item.id, i)}
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="flex justify-between mt-1">
                          <span>Qty: {item.quantity}</span>
                          <span>RM {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-xs opacity-80 mt-1">
                            {item.modifiers.map(m => m.name).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator className="mb-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>RM {getSplitTotal(i).toFixed(2)}</span>
                </div>
              </Card>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Click on an item to assign it to a bill
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm()}>
            Confirm Split ({numSplits} Bills)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
