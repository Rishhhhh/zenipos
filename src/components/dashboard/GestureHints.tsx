import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GestureHints() {
  const [showHints, setShowHints] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if device supports touch
    const hasTouch = window.matchMedia('(pointer: coarse)').matches;
    setIsTouchDevice(hasTouch);
    
    // Show hints only on first visit for touch devices
    if (hasTouch) {
      const hasSeenHints = localStorage.getItem('gesture-hints-seen');
      if (!hasSeenHints) {
        setShowHints(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowHints(false);
    localStorage.setItem('gesture-hints-seen', 'true');
  };

  if (!isTouchDevice || !showHints) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-card/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-border">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-semibold text-foreground">Touch Gestures</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-1"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ul className="text-xs space-y-1.5 text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-base">🤏</span>
            <span>Pinch widgets to resize</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-base">👆👆</span>
            <span>Double-tap to maximize</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-base">👇👇👇</span>
            <span>Three-finger swipe down to minimize</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-base">👈👉</span>
            <span>Swipe categories or modules left/right</span>
          </li>
        </ul>
        <Button
          variant="default"
          size="sm"
          className="w-full mt-3 h-8"
          onClick={handleDismiss}
        >
          Got it!
        </Button>
      </div>
    </div>
  );
}
