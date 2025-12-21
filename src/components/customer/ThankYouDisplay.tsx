import { motion } from "framer-motion";
import { CheckCircle, Star, Gift, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface ThankYouDisplayProps {
  total: number;
  change?: number;
  paymentMethod?: string;
  loyaltyPointsEarned?: number;
  onResetCountdownComplete?: () => void;
}

export function ThankYouDisplay({
  total,
  change,
  paymentMethod,
  loyaltyPointsEarned = 0,
  onResetCountdownComplete,
}: ThankYouDisplayProps) {
  const [countdown, setCountdown] = useState(15);
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
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 p-8">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="mb-8"
      >
        <div className="relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute inset-0 bg-green-500/20 rounded-full blur-3xl scale-150"
          />
          <CheckCircle className="w-32 h-32 text-green-500 relative z-10" />
        </div>
      </motion.div>

      {/* Thank You Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4">
          Thank You!
        </h1>
        <p className="text-2xl text-muted-foreground">
          Your payment was successful
        </p>
      </motion.div>

      {/* Payment Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card rounded-2xl p-6 shadow-lg border mb-8 min-w-[300px]"
      >
        <div className="space-y-3 text-lg">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Paid:</span>
            <span className="font-bold">RM {total.toFixed(2)}</span>
          </div>
          {change !== undefined && change > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Change:</span>
              <span className="font-bold">RM {change.toFixed(2)}</span>
            </div>
          )}
          {paymentMethod && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Method:</span>
              <span className="capitalize">{paymentMethod}</span>
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
          className="flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl px-6 py-4 mb-8 border border-amber-500/30"
        >
          <Gift className="w-8 h-8 text-amber-500" />
          <div>
            <p className="text-lg font-bold text-amber-600">
              +{loyaltyPointsEarned} Points Earned!
            </p>
            <p className="text-sm text-muted-foreground">
              Thanks for being a valued customer
            </p>
          </div>
        </motion.div>
      )}

      {/* Quick Feedback */}
      {!showFeedback ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFeedback(true)}
            className="text-lg"
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
                  className={`w-10 h-10 transition-colors ${
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
              className="text-green-500 font-medium"
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
        className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Returning to welcome screen in {countdown}s</span>
        </div>
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 15, ease: "linear" }}
            className="h-full bg-primary"
          />
        </div>
      </motion.div>
    </div>
  );
}
