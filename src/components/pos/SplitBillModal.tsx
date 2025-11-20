import { useState } from 'react';
import { ResponsiveModal } from '@/components/pos/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Users, Utensils, Grid3x3, DollarSign } from 'lucide-react';
import { CartItem } from '@/lib/store/cart';

interface Split {
  id: string;
  guestName: string;
  items: CartItem[];
  amount: number;
}

interface SplitBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  total: number;
  onSplitConfirm: (splits: Split[]) => void;
}

export function SplitBillModal({
  open,
  onOpenChange,
  items,
  total,
  onSplitConfirm,
}: SplitBillModalProps) {
  const [splitMethod, setSplitMethod] = useState<'even' | 'by_seat' | 'by_item' | 'custom'>('even');
  const [guestCount, setGuestCount] = useState(2);
  const [splits, setSplits] = useState<Split[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>({});

  const handleSplitEvenly = () => {
    const amountPerGuest = total / guestCount;
    const newSplits: Split[] = Array.from({ length: guestCount }, (_, i) => ({
      id: crypto.randomUUID(),
      guestName: `Guest ${i + 1}`,
      items: items.map(item => ({
        ...item,
        quantity: item.quantity / guestCount,
      })),
      amount: amountPerGuest,
    }));
    setSplits(newSplits);
    toast.success(`Bill split evenly among ${guestCount} guests`);
  };

  const handleSplitByItem = () => {
    const newSplits: Split[] = [];
    const assignedItems = new Set<string>();

    Object.entries(selectedItems).forEach(([itemId, splitId]) => {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      let split = newSplits.find(s => s.id === splitId);
      if (!split) {
        split = {
          id: splitId,
          guestName: `Guest ${newSplits.length + 1}`,
          items: [],
          amount: 0,
        };
        newSplits.push(split);
      }

      split.items.push(item);
      split.amount += item.price * item.quantity;
      assignedItems.add(itemId);
    });

    if (assignedItems.size < items.length) {
      toast.warning('Some items are not assigned to any guest');
    }

    setSplits(newSplits);
  };

  const handleItemAssignment = (itemId: string, splitId: string) => {
    setSelectedItems({
      ...selectedItems,
      [itemId]: splitId,
    });
  };

  const handleAddSplit = () => {
    const newSplit: Split = {
      id: crypto.randomUUID(),
      guestName: `Guest ${splits.length + 1}`,
      items: [],
      amount: 0,
    };
    setSplits([...splits, newSplit]);
  };

  const handleConfirm = () => {
    if (splits.length === 0) {
      toast.error('Please create at least one split');
      return;
    }

    const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplit - total) > 0.01) {
      toast.error('Split amounts do not match the total');
      return;
    }

    onSplitConfirm(splits);
    onOpenChange(false);
  };

  return (
    <ResponsiveModal 
      open={open} 
      onOpenChange={onOpenChange}
      title="Split Bill"
      size="lg"
    >

        <Tabs value={splitMethod} onValueChange={(v) => setSplitMethod(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="even">
              <Users className="w-4 h-4 mr-2" />
              Even
            </TabsTrigger>
            <TabsTrigger value="by_seat">
              <Utensils className="w-4 h-4 mr-2" />
              By Seat
            </TabsTrigger>
            <TabsTrigger value="by_item">
              <Grid3x3 className="w-4 h-4 mr-2" />
              By Item
            </TabsTrigger>
            <TabsTrigger value="custom">
              <DollarSign className="w-4 h-4 mr-2" />
              Custom
            </TabsTrigger>
          </TabsList>

          {/* Split Evenly */}
          <TabsContent value="even" className="space-y-4">
            <div>
              <Label>Number of Guests</Label>
              <Input
                type="number"
                min="2"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="mt-2"
              />
            </div>

            <Button onClick={handleSplitEvenly} className="w-full">
              Split Evenly
            </Button>

            {splits.length > 0 && (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Split Preview:</p>
                <div className="space-y-2">
                  {splits.map((split) => (
                    <div key={split.id} className="flex justify-between items-center">
                      <span>{split.guestName}</span>
                      <Badge>RM {split.amount.toFixed(2)}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Split By Item */}
          <TabsContent value="by_item" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Assign Items to Guests</Label>
              <Button size="sm" onClick={handleAddSplit}>Add Guest</Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Items</Label>
                <ScrollArea className="h-[300px] border rounded-md p-3">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <Card key={item.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              RM {item.price.toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <select
                            className="ml-2 text-sm border rounded px-2 py-1"
                            value={selectedItems[item.id] || ''}
                            onChange={(e) => handleItemAssignment(item.id, e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {splits.map((split) => (
                              <option key={split.id} value={split.id}>
                                {split.guestName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <Label className="mb-2 block">Splits</Label>
                <ScrollArea className="h-[300px] border rounded-md p-3">
                  <div className="space-y-3">
                    {splits.map((split) => (
                      <Card key={split.id} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Input
                            value={split.guestName}
                            onChange={(e) => {
                              const newSplits = splits.map(s =>
                                s.id === split.id ? { ...s, guestName: e.target.value } : s
                              );
                              setSplits(newSplits);
                            }}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground">
                            {split.items.length} item(s)
                          </p>
                          <p className="font-bold text-primary">
                            RM {split.amount.toFixed(2)}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <Button onClick={handleSplitByItem} className="w-full">
              Calculate Split
            </Button>
          </TabsContent>

          {/* By Seat */}
          <TabsContent value="by_seat">
            <p className="text-sm text-muted-foreground text-center py-8">
              Seat-based splitting requires table seat assignments. This feature integrates with your table layout.
            </p>
          </TabsContent>

          {/* Custom Split */}
          <TabsContent value="custom" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manually define split amounts for each guest
            </p>
            
            <Button onClick={handleAddSplit} variant="outline" className="w-full">
              Add Guest
            </Button>

            {splits.map((split) => (
              <Card key={split.id} className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Guest Name</Label>
                    <Input
                      value={split.guestName}
                      onChange={(e) => {
                        const newSplits = splits.map(s =>
                          s.id === split.id ? { ...s, guestName: e.target.value } : s
                        );
                        setSplits(newSplits);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={split.amount}
                      onChange={(e) => {
                        const newSplits = splits.map(s =>
                          s.id === split.id ? { ...s, amount: Number(e.target.value) } : s
                        );
                        setSplits(newSplits);
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}

            {splits.length > 0 && (
              <Card className="p-4 bg-accent">
                <div className="flex justify-between items-center">
                  <span>Total Split:</span>
                  <span className="font-bold">
                    RM {splits.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span>Bill Total:</span>
                  <span className="font-bold">RM {total.toFixed(2)}</span>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Confirm Split
          </Button>
        </div>
    </ResponsiveModal>
  );
}
