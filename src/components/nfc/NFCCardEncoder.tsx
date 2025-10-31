import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { nfcCardManager } from "@/lib/nfc/NFCCardManager";
import { NfcIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NFCCardEncoderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const NFCCardEncoder = ({ open, onOpenChange, onSuccess }: NFCCardEncoderProps) => {
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [cardUid, setCardUid] = useState<string>("");
  const [isEncoding, setIsEncoding] = useState(false);

  // Fetch tables without NFC cards
  const { data: tables } = useQuery({
    queryKey: ['tables-without-nfc'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .is('nfc_card_id', null)
        .order('label');
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  const handleEncode = async () => {
    if (!selectedTableId || !cardUid) {
      toast.error("Please select a table and enter card UID");
      return;
    }

    setIsEncoding(true);

    try {
      // Get branch_id from the selected table
      const table = tables?.find(t => t.id === selectedTableId);
      if (!table) throw new Error("Table not found");

      await nfcCardManager.encodeCard(
        selectedTableId,
        table.branch_id || '',
        cardUid
      );

      toast.success("NFC card encoded successfully!");
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setSelectedTableId("");
      setCardUid("");
    } catch (error: any) {
      console.error("Encoding error:", error);
      toast.error(error.message || "Failed to encode card");
    } finally {
      setIsEncoding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <NfcIcon className="h-5 w-5" />
            Encode New NFC Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="table-select">Select Table</Label>
            <Select value={selectedTableId} onValueChange={setSelectedTableId}>
              <SelectTrigger id="table-select">
                <SelectValue placeholder="Choose a table" />
              </SelectTrigger>
              <SelectContent>
                {tables?.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.label} ({table.seats} seats)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tables?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                All tables have NFC cards assigned
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-uid">Card UID (Serial Number)</Label>
            <Input
              id="card-uid"
              placeholder="e.g., 04:5A:B2:C3:D4:E5:F6"
              value={cardUid}
              onChange={(e) => setCardUid(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The unique identifier printed on the NFC card
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Instructions:</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Select the table to assign this card to</li>
              <li>Enter the card's unique ID (UID)</li>
              <li>Hold the blank NFC card near your device</li>
              <li>Click "Encode Card" to write the data</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isEncoding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEncode}
            disabled={isEncoding || !selectedTableId || !cardUid}
          >
            {isEncoding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Encoding...
              </>
            ) : (
              <>
                <NfcIcon className="mr-2 h-4 w-4" />
                Encode Card
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
