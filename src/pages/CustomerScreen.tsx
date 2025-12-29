import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCustomerDisplaySync } from '@/hooks/useCustomerDisplaySync';
import { MarketingCarousel } from '@/components/customer/MarketingCarousel';
import { OrderDisplay } from '@/components/customer/OrderDisplay';
import { PaymentDisplay } from '@/components/customer/PaymentDisplay';
import { PaymentPendingDisplay } from '@/components/customer/PaymentPendingDisplay';
import { ThankYouDisplay } from '@/components/customer/ThankYouDisplay';
import { CustomerHeader } from '@/components/customer/CustomerHeader';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export default function CustomerScreen() {
  const { sessionId: urlSessionId } = useParams();
  
  // Generate or retrieve display session ID
  const [displaySessionId] = useState(() => {
    // Check URL parameter first (from route param)
    if (urlSessionId) {
      sessionStorage.setItem('customer-display-id', urlSessionId);
      return urlSessionId;
    }
    
    // Check query parameter (legacy support)
    const urlParams = new URLSearchParams(window.location.search);
    const urlDisplayId = urlParams.get('displayId');
    
    if (urlDisplayId) {
      sessionStorage.setItem('customer-display-id', urlDisplayId);
      return urlDisplayId;
    }
    
    // Check storage
    const stored = sessionStorage.getItem('customer-display-id');
    if (stored) return stored;
    
    // Generate new
    const newId = `display-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('customer-display-id', newId);
    return newId;
  });

  const { displaySession, isConnected, error, lastSync } = useCustomerDisplaySync(displaySessionId);

  // Show connection status briefly
  const [showConnecting, setShowConnecting] = useState(true);
  
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => setShowConnecting(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  // Auto-reset to idle after thank you screen
  const handleResetToIdle = async () => {
    console.log('Thank you screen complete, resetting to idle');
    // Update DB to idle mode
    await supabase
      .from('customer_display_sessions')
      .update({
        mode: 'idle',
        cart_items: [],
        order_items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        change: null,
        payment_method: null,
        payment_qr: null,
        last_activity: new Date().toISOString(),
      })
      .eq('session_id', displaySessionId);
  };

  // Fullscreen on F11 or double-click (for kiosk mode)
  useEffect(() => {
    const handleFullscreen = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      }
    };
    
    window.addEventListener('keydown', handleFullscreen);
    return () => window.removeEventListener('keydown', handleFullscreen);
  }, []);

  // Error screen
  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-muted">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md px-4"
        >
          <WifiOff className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Connection Error
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            {error}
          </p>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm font-mono text-muted-foreground">
            Session: {displaySessionId}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry Connection
          </button>
        </motion.div>
      </div>
    );
  }

  // Connection screen
  if (showConnecting || !isConnected) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Connecting to POS...
          </h1>
          <p className="text-lg text-muted-foreground">
            Customer Display
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground/70">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="text-sm font-mono">{displaySessionId}</span>
          </div>
          {lastSync && (
            <div className="mt-2 text-xs text-muted-foreground/50">
              Last sync: {lastSync.toLocaleTimeString()}
            </div>
          )}
        </motion.div>
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
            nfcCardUid={displaySession.nfcCardUid}
            tableLabel={displaySession.tableLabel}
          />
        );
      
      case 'payment_pending':
        return (
          <PaymentPendingDisplay
            tableLabel={displaySession.tableLabel}
            orderItems={displaySession.orderItems || []}
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
            qrImageUrl={displaySession.paymentQRImageUrl}
            paymentMethod={displaySession.paymentMethod as any}
            isComplete={false}
          />
        );
      
      case 'complete':
        return (
          <ThankYouDisplay
            total={displaySession.total || 0}
            change={displaySession.change}
            paymentMethod={displaySession.paymentMethod}
            orderItems={displaySession.orderItems}
            tableLabel={displaySession.tableLabel}
            onResetCountdownComplete={handleResetToIdle}
          />
        );
      
      case 'idle':
      default:
        return <MarketingCarousel />;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      {/* Connection status indicator */}
      <AnimatePresence>
        {displaySession.mode !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CustomerHeader />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={displaySession.mode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Connection status badge (dev mode only) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-black/70 text-white text-xs rounded-full font-mono backdrop-blur">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{displaySession.mode}</span>
          <span className="text-white/50">|</span>
          <span className="text-white/70">{displaySessionId.substring(0, 16)}...</span>
        </div>
      )}
    </div>
  );
}
