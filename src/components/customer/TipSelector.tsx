import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Coins } from "lucide-react";

interface TipSelectorProps {
  total: number;
  onTipSelected: (tip: number) => void;
  selectedTip?: number;
}

const TIP_PRESETS = [
  { label: "No Tip", value: 0 },
  { label: "RM 2", value: 2 },
  { label: "RM 5", value: 5 },
  { label: "RM 10", value: 10 },
];

export function TipSelector({ total, onTipSelected, selectedTip = 0 }: TipSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const handlePresetClick = (value: number) => {
    setShowCustom(false);
    setCustomAmount("");
    onTipSelected(value);
  };

  const handleCustomSubmit = () => {
    const amount = parseFloat(customAmount);
    if (!isNaN(amount) && amount >= 0) {
      onTipSelected(amount);
    }
  };

  const isSelected = (value: number) => {
    if (showCustom) return false;
    return selectedTip === value;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-6 border shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-pink-500" />
        <h3 className="text-lg font-semibold">Add a Tip?</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Show appreciation for great service
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {TIP_PRESETS.map((preset) => (
          <motion.button
            key={preset.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePresetClick(preset.value)}
            className={`py-4 px-6 rounded-lg border-2 font-medium text-lg transition-all ${
              isSelected(preset.value)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background hover:border-primary/50"
            }`}
          >
            {preset.label}
          </motion.button>
        ))}
      </div>

      {/* Custom Amount Toggle */}
      <Button
        variant="outline"
        onClick={() => setShowCustom(!showCustom)}
        className="w-full mb-3"
      >
        <Coins className="w-4 h-4 mr-2" />
        Custom Amount
      </Button>

      {showCustom && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              RM
            </span>
            <Input
              type="number"
              placeholder="0.00"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="pl-10 text-lg h-12"
              min="0"
              step="0.50"
            />
          </div>
          <Button onClick={handleCustomSubmit} className="h-12 px-6">
            Add
          </Button>
        </motion.div>
      )}

      {/* Total with Tip */}
      {selectedTip > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 pt-4 border-t flex justify-between items-center"
        >
          <span className="text-muted-foreground">New Total:</span>
          <span className="text-2xl font-bold text-primary">
            RM {(total + selectedTip).toFixed(2)}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
