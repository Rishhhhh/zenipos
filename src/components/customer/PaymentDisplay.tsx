import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, Loader2, Smartphone, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '@/components/ui/badge';

interface PaymentDisplayProps {
  total: number;
  qrCodeUrl?: string;
  isComplete?: boolean;
  change?: number;
  paymentMethod?: 'cash' | 'qr' | 'duitnow' | 'tng';
  isProcessing?: boolean;
}

// Round to nearest 10 sen
const roundToNearest10Sen = (amount: number): number => {
  return Math.round(amount * 10) / 10;
};

export function PaymentDisplay({ 
  total, 
  qrCodeUrl, 
  isComplete, 
  change,
  paymentMethod,
  isProcessing
}: PaymentDisplayProps) {
  const roundedTotal = roundToNearest10Sen(total);
  const rounding = roundedTotal - total;

  // Payment Complete View - now handled by ThankYouDisplay, but keep as fallback
  if (isComplete) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-500/10 via-background to-green-500/10 p-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          <CheckCircle className="w-32 h-32 text-green-500 mb-8" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-6xl font-bold text-foreground mb-4"
        >
          Payment Complete!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl text-muted-foreground mb-8"
        >
          Thank you for your purchase
        </motion.p>
        {change !== undefined && change > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-8 bg-card">
              <p className="text-2xl text-muted-foreground mb-2">Your Change</p>
              <p className="text-5xl font-bold text-primary">
                RM {change.toFixed(2)}
              </p>
            </Card>
          </motion.div>
        )}
      </div>
    );
  }

  // Processing View
  if (isProcessing) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-8"
          >
            <Loader2 className="w-24 h-24 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Processing Payment...
          </h1>
          <p className="text-xl text-muted-foreground">
            Please wait while we verify your payment
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-12">
          Complete Payment
        </h1>

        <Card className="p-10 mb-8 bg-card border-2">
          {/* Amount Display with Rounding */}
          <div className="mb-10">
            <p className="text-2xl text-muted-foreground mb-2">Amount Due</p>
            <motion.p 
              key={roundedTotal}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-7xl font-bold text-primary"
            >
              RM {roundedTotal.toFixed(2)}
            </motion.p>
            {Math.abs(rounding) > 0.001 && (
              <p className="text-sm text-muted-foreground mt-2">
                Rounded from RM {total.toFixed(2)} ({rounding > 0 ? '+' : ''}{rounding.toFixed(2)})
              </p>
            )}
          </div>

          {qrCodeUrl ? (
            <div className="flex flex-col items-center gap-6">
              {/* Provider Badge */}
              {(paymentMethod === 'duitnow' || paymentMethod === 'tng') && (
                <Badge variant="secondary" className="text-lg py-2 px-4">
                  <Wallet className="w-4 h-4 mr-2" />
                  {paymentMethod === 'duitnow' ? 'DuitNow QR' : "Touch 'n Go"}
                </Badge>
              )}
              
              {/* QR Code */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-2xl shadow-xl border-4 border-primary/20"
              >
                <QRCodeSVG 
                  value={qrCodeUrl}
                  size={240}
                  level="H"
                  includeMargin={true}
                />
              </motion.div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Smartphone className="w-6 h-6 text-primary animate-bounce" />
                  <p className="text-2xl font-semibold text-foreground">
                    Scan to Pay
                  </p>
                </div>
                <p className="text-lg text-muted-foreground">
                  Open your banking app and scan the QR code
                </p>
              </div>
              
              {/* Waiting indicator */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Waiting for payment confirmation...</span>
              </motion.div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CreditCard className="w-28 h-28 text-primary" />
              </motion.div>
              <div className="space-y-2">
                <p className="text-2xl font-semibold text-foreground">
                  Ready to Pay
                </p>
                <p className="text-lg text-muted-foreground">
                  Please complete payment with our cashier
                </p>
              </div>
              
              {/* Payment method hints */}
              <div className="flex gap-4 mt-4">
                <Badge variant="outline" className="py-2 px-4">
                  Cash
                </Badge>
                <Badge variant="outline" className="py-2 px-4">
                  DuitNow
                </Badge>
                <Badge variant="outline" className="py-2 px-4">
                  Touch 'n Go
                </Badge>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
