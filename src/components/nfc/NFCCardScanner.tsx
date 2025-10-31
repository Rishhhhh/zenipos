import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NfcIcon, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { nfcCardManager } from "@/lib/nfc/NFCCardManager";
import { toast } from "sonner";

interface NFCCardScannerProps {
  onScanSuccess: (tableId: string) => void;
  onCancel?: () => void;
}

export const NFCCardScanner = ({ onScanSuccess, onCancel }: NFCCardScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');

  const handleScan = async () => {
    setIsScanning(true);
    setScanStatus('scanning');

    try {
      const result = await nfcCardManager.scanAndVerify();

      if (result.isValid) {
        setScanStatus('success');
        setTimeout(() => {
          onScanSuccess(result.tableId);
        }, 500);
      } else {
        setScanStatus('error');
        toast.error("Invalid or inactive NFC card");
        setTimeout(() => setScanStatus('idle'), 2000);
      }
    } catch (error: any) {
      console.error("Scan error:", error);
      setScanStatus('error');
      setTimeout(() => setScanStatus('idle'), 2000);
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusIcon = () => {
    switch (scanStatus) {
      case 'scanning':
        return <Loader2 className="h-16 w-16 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle2 className="h-16 w-16 text-success" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-destructive" />;
      default:
        return <NfcIcon className="h-16 w-16 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (scanStatus) {
      case 'scanning':
        return "Hold card near device...";
      case 'success':
        return "Card detected!";
      case 'error':
        return "Scan failed";
      default:
        return "Ready to scan";
    }
  };

  return (
    <Card className="p-8">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          {getStatusIcon()}
          {scanStatus === 'scanning' && (
            <div className="absolute inset-0 animate-ping">
              <div className="h-full w-full rounded-full bg-primary/20" />
            </div>
          )}
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">{getStatusText()}</h3>
          <p className="text-sm text-muted-foreground">
            {scanStatus === 'idle' && "Tap the button below to start scanning"}
            {scanStatus === 'scanning' && "Place the NFC card near your device"}
            {scanStatus === 'success' && "Table order loading..."}
            {scanStatus === 'error' && "Please try again"}
          </p>
        </div>

        <div className="flex gap-3 w-full">
          {scanStatus === 'idle' && (
            <>
              <Button
                onClick={handleScan}
                disabled={isScanning}
                className="flex-1"
                size="lg"
              >
                <NfcIcon className="mr-2 h-5 w-5" />
                Scan NFC Card
              </Button>
              {onCancel && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  size="lg"
                >
                  Cancel
                </Button>
              )}
            </>
          )}
          {scanStatus === 'error' && (
            <Button
              onClick={handleScan}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
