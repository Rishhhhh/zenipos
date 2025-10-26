import { Button } from '@/components/ui/button';
import { Delete, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedPinPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

export function AnimatedPinPad({ 
  value, 
  onChange, 
  maxLength = 5, 
  disabled = false 
}: AnimatedPinPadProps) {
  const handleKeyPress = (key: string) => {
    if (disabled) return;
    
    if (key === 'clear') {
      onChange('');
    } else if (key === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (value.length < maxLength) {
      onChange(value + key);
    }
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'backspace'],
  ];

  return (
    <div className="space-y-6">
      {/* PIN Display */}
      <div className="flex justify-center items-center gap-3 min-h-[60px]">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-4 h-4 rounded-full border-2 transition-all duration-200',
              i < value.length
                ? 'bg-danger border-danger shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-[pin-dot-pulse_0.3s_ease]'
                : 'bg-transparent border-border/30'
            )}
          />
        ))}
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-3">
        {keys.map((row, rowIndex) =>
          row.map((key) => {
            const isSpecial = key === 'clear' || key === 'backspace';
            
            return (
              <Button
                key={key}
                variant="ghost"
                onClick={() => handleKeyPress(key)}
                disabled={disabled}
                className={cn(
                  'h-20 text-2xl font-semibold transition-all duration-150',
                  'glass border border-border/20',
                  'hover:bg-danger/20 hover:border-danger/50 hover:scale-105',
                  'active:scale-95 active:animate-[dock-bounce_0.4s_ease]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isSpecial && 'text-muted-foreground'
                )}
              >
                {key === 'clear' ? (
                  <X className="h-6 w-6" />
                ) : key === 'backspace' ? (
                  <Delete className="h-6 w-6" />
                ) : (
                  key
                )}
              </Button>
            );
          })
        )}
      </div>
    </div>
  );
}
