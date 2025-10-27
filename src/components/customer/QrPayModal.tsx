import { GlassModal } from '@/components/modals/GlassModal';
import { Badge } from '@/components/ui/badge';
import { QrCode, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QrPayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  orderId?: string;
  provider?: 'stripe' | 'billplz' | 'paypal';
}

export function QrPayModal({ 
  open, 
  onOpenChange, 
  amount, 
  orderId,
  provider = 'stripe' 
}: QrPayModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');

  useEffect(() => {
    if (open && orderId) {
      // Stub: Generate QR code URL
      // Phase 2: Call payment provider API
      setTimeout(() => {
        setQrCodeUrl(`https://placeholder-qr.com/${orderId}`);
      }, 1000);
    }
  }, [open, orderId]);

  return (
    <GlassModal 
      open={open} 
      onOpenChange={onOpenChange}
      title="Scan to Pay"
      size="sm"
      variant="default"
    >
      <div className="flex flex-col items-center py-8">
        {!qrCodeUrl ? (
          <Loader2 className="h-48 w-48 text-primary animate-spin" />
        ) : (
          <>
            <QrCode className="h-48 w-48 text-primary mb-4" />
            <p className="text-2xl font-bold mb-2">${amount.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mb-4">
              Scan with your banking app
            </p>
            <Badge variant="outline">{provider.toUpperCase()}</Badge>
          </>
        )}
      </div>
      
      {paymentStatus === 'processing' && (
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Confirming payment...</p>
        </div>
      )}
    </GlassModal>
  );
}
