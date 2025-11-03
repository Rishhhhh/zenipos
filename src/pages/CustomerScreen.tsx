import { useEffect, useState } from 'react';
import { useCustomerDisplaySync } from '@/hooks/useCustomerDisplaySync';
import { MarketingCarousel } from '@/components/customer/MarketingCarousel';
import { OrderDisplay } from '@/components/customer/OrderDisplay';
import { PaymentDisplay } from '@/components/customer/PaymentDisplay';
import { Loader2 } from 'lucide-react';

export default function CustomerScreen() {
  // Generate or retrieve display session ID
  const [displaySessionId] = useState(() => {
    const stored = sessionStorage.getItem('customer-display-id');
    if (stored) return stored;
    const newId = `display-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('customer-display-id', newId);
    return newId;
  });

  const { displaySession, isConnected } = useCustomerDisplaySync(displaySessionId);

  // Show connection status briefly
  const [showConnecting, setShowConnecting] = useState(true);
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => setShowConnecting(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  if (showConnecting || !isConnected) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
        <p className="text-2xl text-muted-foreground">
          Connecting to POS...
        </p>
        <p className="text-lg text-muted-foreground/70 mt-2">
          Display ID: {displaySessionId}
        </p>
      </div>
    );
  }

  const renderContent = () => {
    switch (displaySession.mode) {
      case 'ordering':
        return (
          <OrderDisplay
            items={displaySession.cartItems || []}
            subtotal={displaySession.subtotal || 0}
            tax={displaySession.tax || 0}
            discount={displaySession.discount || 0}
            total={displaySession.total || 0}
          />
        );
      
      case 'payment':
        return (
          <PaymentDisplay
            total={displaySession.total || 0}
            qrCodeUrl={displaySession.paymentQR}
            isComplete={false}
          />
        );
      
      case 'complete':
        return (
          <PaymentDisplay
            total={displaySession.total || 0}
            isComplete={true}
            change={displaySession.change}
          />
        );
      
      case 'idle':
      default:
        return <MarketingCarousel />;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background">
      {renderContent()}
      
      {/* Display session ID badge (hidden in production) */}
      {import.meta.env.DEV && (
        <div className="fixed top-4 right-4 px-3 py-1 bg-black/50 text-white text-xs rounded-full font-mono">
          {displaySessionId}
        </div>
      )}
    </div>
  );
}
