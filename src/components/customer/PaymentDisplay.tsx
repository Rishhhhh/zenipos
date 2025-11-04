import { motion } from 'framer-motion';
import { QrCode, CreditCard, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { QRCodeSVG } from 'qrcode.react';

interface PaymentDisplayProps {
  total: number;
  qrCodeUrl?: string;
  isComplete?: boolean;
  change?: number;
}

export function PaymentDisplay({ total, qrCodeUrl, isComplete, change }: PaymentDisplayProps) {
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
                ${change.toFixed(2)}
              </p>
            </Card>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-5xl font-bold text-foreground mb-12">
          Complete Payment
        </h1>

        <Card className="p-12 mb-8 bg-card">
          <div className="mb-8">
            <p className="text-2xl text-muted-foreground mb-2">Amount Due</p>
            <p className="text-7xl font-bold text-primary">
              ${total.toFixed(2)}
            </p>
          </div>

          {qrCodeUrl ? (
            <div className="flex flex-col items-center gap-6">
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <QRCodeSVG 
                  value={qrCodeUrl}
                  size={256}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-semibold text-foreground">
                  Scan to Pay
                </p>
                <p className="text-xl text-muted-foreground">
                  Use your banking app to scan the QR code
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <CreditCard className="w-32 h-32 text-primary animate-pulse" />
              <p className="text-2xl text-muted-foreground">
                Please complete payment with cashier
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
