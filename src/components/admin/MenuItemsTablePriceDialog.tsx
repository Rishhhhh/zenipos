import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  priceAdjustment: { type: string; value: number };
  onPriceAdjustmentChange: (adjustment: { type: string; value: number }) => void;
  onConfirm: () => void;
}

export function PriceDialog({ open, onOpenChange, selectedCount, priceAdjustment, onPriceAdjustmentChange, onConfirm }: PriceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Price Update</DialogTitle>
          <DialogDescription>Update prices for {selectedCount} selected item(s)</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={priceAdjustment.type} onValueChange={(type) => onPriceAdjustmentChange({ ...priceAdjustment, type })}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percentage" id="percentage" />
              <Label htmlFor="percentage">Percentage Change (%)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fixed" id="fixed" />
              <Label htmlFor="fixed">Fixed Amount (RM)</Label>
            </div>
          </RadioGroup>
          <Input type="number" step="0.01" placeholder={priceAdjustment.type === 'percentage' ? 'e.g., 10 for +10%' : 'e.g., 2.50'} value={priceAdjustment.value} onChange={(e) => onPriceAdjustmentChange({ ...priceAdjustment, value: parseFloat(e.target.value) || 0 })} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm}>Update Prices</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
