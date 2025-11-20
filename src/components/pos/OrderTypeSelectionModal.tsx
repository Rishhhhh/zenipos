import { ResponsiveModal } from '@/components/pos/ResponsiveModal';
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
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Select Order Type"
      side="bottom"
      size="md"
    >

        {/* Display Selected NFC Card */}
        <div className="flex items-center justify-center mb-6">
          <Badge className="text-base px-6 py-3 bg-primary/20 border-2 border-primary text-primary font-semibold">
            <NfcIcon className="h-5 w-5 mr-2" />
            Card: {nfcCardUid}
          </Badge>
        </div>

        {/* Order Type Selection Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dine In Button */}
          <Button
            variant="default"
            size="lg"
            className="h-40 flex-col gap-4 text-xl bg-primary hover:bg-primary/90 transition-all hover:scale-105"
            onClick={onSelectDineIn}
          >
            <UtensilsCrossed className="h-16 w-16" />
            <div className="flex flex-col items-center gap-2">
              <span className="font-bold">Dine In 🍽️</span>
              <span className="text-sm font-normal opacity-90">Select table number</span>
            </div>
          </Button>

          {/* Takeaway Button */}
          <Button
            variant="outline"
            size="lg"
            className="h-40 flex-col gap-4 text-xl hover:bg-accent transition-all hover:scale-105"
            onClick={onSelectTakeaway}
          >
            <ShoppingBag className="h-16 w-16" />
            <div className="flex flex-col items-center gap-2">
              <span className="font-bold">Takeaway 🛍️</span>
              <span className="text-sm font-normal opacity-80">Skip table selection</span>
            </div>
          </Button>
        </div>
    </ResponsiveModal>
  );
}
