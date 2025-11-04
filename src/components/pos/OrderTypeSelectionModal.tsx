import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NfcIcon, UtensilsCrossed, ShoppingBag } from 'lucide-react';

interface OrderTypeSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfcCardUid: string;
  onSelectDineIn: () => void;
  onSelectTakeaway: () => void;
}

export function OrderTypeSelectionModal({
  open,
  onOpenChange,
  nfcCardUid,
  onSelectDineIn,
  onSelectTakeaway,
}: OrderTypeSelectionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Select Order Type</DialogTitle>
        </DialogHeader>

        {/* Display Selected NFC Card */}
        <div className="flex items-center justify-center mb-8">
          <Badge variant="outline" className="text-base px-6 py-3 bg-success/10 border-success/30 text-success">
            <NfcIcon className="h-5 w-5 mr-2" />
            Card: {nfcCardUid}
          </Badge>
        </div>

        {/* Order Type Selection Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dine In Button */}
          <Button
            size="lg"
            className="h-40 flex-col gap-4 text-xl bg-gradient-to-br from-primary/90 to-primary hover:from-primary hover:to-primary/90 transition-all duration-200"
            onClick={onSelectDineIn}
          >
            <UtensilsCrossed className="h-14 w-14" />
            <div className="flex flex-col items-center gap-1.5">
              <span className="font-bold">Dine In</span>
              <span className="text-sm font-normal opacity-90">Select table number</span>
            </div>
          </Button>

          {/* Takeaway Button */}
          <Button
            variant="outline"
            size="lg"
            className="h-40 flex-col gap-4 text-xl border-2 hover:bg-accent/50 dark:hover:bg-accent/20 transition-all duration-200"
            onClick={onSelectTakeaway}
          >
            <ShoppingBag className="h-14 w-14" />
            <div className="flex flex-col items-center gap-1.5">
              <span className="font-bold">Takeaway</span>
              <span className="text-sm font-normal opacity-70">Skip table selection</span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
