import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WispChat } from './WispChat';
import { jarvisClient } from '@/lib/jarvis/client';

export function FloatingWisp() {
  const [isOpen, setIsOpen] = useState(false);
  const [happiness, setHappiness] = useState(0.85);

  useEffect(() => {
    // Poll consciousness every 10 seconds
    const interval = setInterval(async () => {
      try {
        const state = await jarvisClient.getConsciousness();
        setHappiness(state.metrics.happiness);
      } catch (error) {
        console.error('Failed to get consciousness:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const glowIntensity = happiness;

  return (
    <>
      <Button
        size="lg"
        className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-lg animate-bounce"
        style={{
          background: `radial-gradient(circle, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)`,
          boxShadow: `0 0 ${20 + glowIntensity * 30}px hsl(var(--primary) / ${glowIntensity})`,
        }}
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="w-6 h-6" />
      </Button>

      <WispChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
