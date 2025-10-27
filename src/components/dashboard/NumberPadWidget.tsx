import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Copy, Delete } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function NumberPadWidget() {
  const [display, setDisplay] = useState("0.00");

  const handleNumberClick = (num: string) => {
    if (display === "0.00") {
      setDisplay(num === "." ? "0." : num);
    } else {
      // Prevent multiple decimals
      if (num === "." && display.includes(".")) return;
      
      // Limit to 2 decimal places
      const parts = display.split(".");
      if (parts[1] && parts[1].length >= 2) return;
      
      setDisplay(display + num);
    }
  };

  const handleClear = () => {
    setDisplay("0.00");
  };

  const handleBackspace = () => {
    if (display.length <= 1) {
      setDisplay("0.00");
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    toast.success("Copied to clipboard");
  };

  const formatDisplay = () => {
    const num = parseFloat(display) || 0;
    return `RM ${num.toFixed(2)}`;
  };

  const buttons = [
    "7", "8", "9",
    "4", "5", "6",
    "1", "2", "3",
    ".", "0", "C",
  ];

  return (
    <Card className="glass-card p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Quick Calculator</h3>
      </div>

      {/* Display */}
      <div className="mb-4 p-4 bg-accent/30 rounded-lg">
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">Amount</p>
          <p className="text-2xl font-mono font-bold text-primary">
            {formatDisplay()}
          </p>
        </div>
      </div>

      {/* Number Pad Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {buttons.map((btn) => (
          <Button
            key={btn}
            onClick={() =>
              btn === "C" ? handleClear() : handleNumberClick(btn)
            }
            variant={btn === "C" ? "destructive" : "outline"}
            className={cn(
              "h-12 text-lg font-semibold",
              btn === "C" && "bg-danger/20 text-danger hover:bg-danger/30"
            )}
          >
            {btn}
          </Button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <Button
          onClick={handleBackspace}
          variant="outline"
          size="sm"
          className="flex items-center justify-center gap-2"
        >
          <Delete className="h-4 w-4" />
          Delete
        </Button>
        <Button
          onClick={handleCopy}
          variant="default"
          size="sm"
          className="flex items-center justify-center gap-2"
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </div>
    </Card>
  );
}
