import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Delete, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Denomination {
  value: number;
  label: string;
  color?: string;
}

interface TouchDenominationPadProps {
  denominations: Denomination[];
  values: Record<number, number>;
  onValueChange: (denomination: number, count: number) => void;
  disabled?: boolean;
  columns?: 2 | 3 | 4;
  variant?: 'notes' | 'coins';
}

interface NumpadOverlayProps {
  denomination: Denomination;
  currentValue: number;
  onConfirm: (value: number) => void;
  onCancel: () => void;
}

function NumpadOverlay({ denomination, currentValue, onConfirm, onCancel }: NumpadOverlayProps) {
  const [inputValue, setInputValue] = useState(currentValue > 0 ? currentValue.toString() : '');

  const handleKeyPress = useCallback((key: string) => {
    if (key === 'backspace') {
      setInputValue(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setInputValue('');
    } else {
      // Limit to 4 digits (max 9999 notes)
      if (inputValue.length < 4) {
        setInputValue(prev => prev + key);
      }
    }
  }, [inputValue]);

  const numpadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'backspace'],
  ];

  const parsedValue = parseInt(inputValue) || 0;
  const subtotal = denomination.value * parsedValue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={cn(
          "p-4 border-b",
          denomination.color || "bg-primary/10"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">{denomination.label}</p>
              <p className="text-sm text-muted-foreground">Enter quantity</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Display */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-lg">×</span>
              <div className="text-4xl font-bold tabular-nums min-w-[100px]">
                {inputValue || '0'}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Subtotal</p>
              <p className="text-xl font-bold text-primary tabular-nums">
                RM {subtotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Numpad */}
        <div className="p-3 space-y-2 bg-card">
          {numpadKeys.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-3 gap-2">
              {row.map((key) => (
                <Button
                  key={key}
                  variant="secondary"
                  className={cn(
                    "h-14 text-2xl font-bold transition-all active:scale-95",
                    key === 'clear' && "text-base text-muted-foreground",
                    key === 'backspace' && "text-base"
                  )}
                  onClick={() => handleKeyPress(key)}
                >
                  {key === 'backspace' ? (
                    <Delete className="h-6 w-6" />
                  ) : key === 'clear' ? (
                    'CLR'
                  ) : (
                    key
                  )}
                </Button>
              ))}
            </div>
          ))}
        </div>

        {/* Confirm Button */}
        <div className="p-3 pt-0">
          <Button
            className="w-full h-14 text-lg font-bold gap-2"
            onClick={() => onConfirm(parsedValue)}
          >
            <Check className="h-5 w-5" />
            Confirm ({parsedValue} × {denomination.label} = RM {subtotal.toFixed(2)})
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TouchDenominationPad({
  denominations,
  values,
  onValueChange,
  disabled = false,
  columns = 3,
  variant = 'notes',
}: TouchDenominationPadProps) {
  const [activeDenomination, setActiveDenomination] = useState<Denomination | null>(null);

  const handleTileTap = (denom: Denomination) => {
    if (disabled) return;
    setActiveDenomination(denom);
  };

  const handleConfirm = (value: number) => {
    if (activeDenomination) {
      onValueChange(activeDenomination.value, value);
      setActiveDenomination(null);
    }
  };

  const handleCancel = () => {
    setActiveDenomination(null);
  };

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <>
      <div className={cn("grid gap-2", gridCols[columns])}>
        {denominations.map((denom) => {
          const count = values[denom.value] || 0;
          const subtotal = denom.value * count;
          const isActive = count > 0;

          if (variant === 'coins') {
            return (
              <button
                key={denom.value}
                type="button"
                onClick={() => handleTileTap(denom)}
                disabled={disabled}
                className={cn(
                  "relative rounded-xl border border-border bg-muted/30 p-3 transition-all",
                  "hover:bg-muted/50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50",
                  isActive && "ring-1 ring-primary/50 bg-primary/5",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="text-center mb-1">
                  <span className="font-medium text-sm">{denom.label}</span>
                </div>
                <div className={cn(
                  "h-10 flex items-center justify-center rounded-lg text-xl font-bold tabular-nums",
                  isActive ? "bg-primary/20 text-primary" : "bg-background/80 text-muted-foreground"
                )}>
                  {count}
                </div>
              </button>
            );
          }

          return (
            <button
              key={denom.value}
              type="button"
              onClick={() => handleTileTap(denom)}
              disabled={disabled}
              className={cn(
                "relative rounded-xl border p-3 transition-all text-left",
                "hover:brightness-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50",
                denom.color || "bg-muted/30 border-border",
                isActive && "ring-1 ring-primary/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{denom.label}</span>
                {isActive && (
                  <span className="text-xs font-medium text-primary">
                    RM {subtotal.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">×</span>
                <div className={cn(
                  "flex-1 h-10 flex items-center justify-center rounded-lg text-xl font-bold tabular-nums",
                  isActive ? "bg-primary/20 text-primary" : "bg-background/80 text-muted-foreground"
                )}>
                  {count}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Numpad Overlay */}
      {activeDenomination && (
        <NumpadOverlay
          denomination={activeDenomination}
          currentValue={values[activeDenomination.value] || 0}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
