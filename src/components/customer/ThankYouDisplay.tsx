import { motion } from "framer-motion";
import { CheckCircle, Star, Gift, Clock, Sparkles, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface ThankYouDisplayProps {
  total: number;
  change?: number;
  paymentMethod?: string;
  loyaltyPointsEarned?: number;
  orderItems?: OrderItem[];
  tableLabel?: string;
  onResetCountdownComplete?: () => void;
}

export function ThankYouDisplay({
  total,
  change,
  paymentMethod,
  loyaltyPointsEarned = 0,
  orderItems = [],
  tableLabel,
  onResetCountdownComplete,
}: ThankYouDisplayProps) {
  const [countdown, setCountdown] = useState(10);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    if (countdown <= 0) {
      onResetCountdownComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onResetCountdownComplete]);

  const handleRating = (stars: number) => {
    setRating(stars);
    // Could save feedback to database here
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-500/5 via-primary/5 to-accent/5 p-8 relative overflow-hidden">
      {/* Confetti particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            y: -20, 
            x: Math.random() * window.innerWidth,
            opacity: 0,
            rotate: 0,
          }}
          animate={{ 
            y: window.innerHeight + 20, 
            opacity: [0, 1, 1, 0],
            rotate: 360,
          }}
          transition={{ 
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
            repeat: Infinity,
            repeatDelay: Math.random() * 3,
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            backgroundColor: ['#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6'][i % 5],
          }}
        />
      ))}

      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
        className="mb-8 relative"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-green-500/30 rounded-full blur-3xl scale-150"
        />
        <div className="relative z-10 w-36 h-36 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30">
          <CheckCircle className="w-20 h-20 text-white" strokeWidth={2.5} />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="w-10 h-10 text-amber-400" />
        </motion.div>
      </motion.div>

      {/* Thank You Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <PartyPopper className="w-10 h-10 text-primary" />
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-green-500 via-primary to-green-500 bg-clip-text text-transparent">
            Thank You!
          </h1>
          <PartyPopper className="w-10 h-10 text-primary scale-x-[-1]" />
        </div>
        <p className="text-2xl text-muted-foreground">
          Your payment was successful
        </p>
        {tableLabel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full"
          >
            <span className="text-lg text-primary font-medium">{tableLabel}</span>
          </motion.div>
        )}
      </motion.div>

      {/* Payment Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card rounded-3xl p-8 shadow-xl border-2 border-green-500/20 mb-8 min-w-[350px]"
      >
        <div className="space-y-4 text-lg">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Paid</span>
            <span className="text-3xl font-bold text-foreground">RM {total.toFixed(2)}</span>
          </div>
          {change !== undefined && change > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="flex justify-between items-center py-3 px-4 bg-green-500/10 rounded-xl border border-green-500/20"
            >
              <span className="text-green-600 font-medium">Change</span>
              <span className="text-2xl font-bold text-green-600">RM {change.toFixed(2)}</span>
            </motion.div>
          )}
          {paymentMethod && (
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="capitalize px-3 py-1 bg-muted rounded-lg font-medium">{paymentMethod}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Loyalty Points Earned */}
      {loyaltyPointsEarned > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl px-8 py-5 mb-8 border border-amber-500/30"
        >
          <Gift className="w-10 h-10 text-amber-500" />
          <div>
            <p className="text-2xl font-bold text-amber-600">
              +{loyaltyPointsEarned} Points Earned!
            </p>
            <p className="text-muted-foreground">
              Thanks for being a valued customer
            </p>
          </div>
        </motion.div>
      )}

      {/* See you again message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-xl text-muted-foreground mb-6"
      >
        See you again soon! 👋
      </motion.p>

      {/* Quick Feedback */}
      {!showFeedback ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFeedback(true)}
            className="text-lg rounded-xl"
          >
            <Star className="w-5 h-5 mr-2" />
            Rate Your Experience
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-lg text-muted-foreground">How was your experience?</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleRating(star)}
                className="p-2"
              >
                <Star
                  className={`w-12 h-12 transition-colors ${
                    rating && star <= rating
                      ? "text-amber-500 fill-amber-500"
                      : "text-muted-foreground"
                  }`}
                />
              </motion.button>
            ))}
          </div>
          {rating && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-500 font-medium text-lg"
            >
              Thank you for your feedback!
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Auto-reset countdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-5 h-5" />
          <span className="text-base">Returning to welcome screen in {countdown}s</span>
        </div>
        <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 10, ease: "linear" }}
            className="h-full bg-gradient-to-r from-green-500 to-primary rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
}
