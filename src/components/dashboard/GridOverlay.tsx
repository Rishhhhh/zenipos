import { useState, useEffect, useRef } from "react";
import { GRID_CONFIG } from "@/lib/widgets/gridSystem";

export function GridOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Initial calculation
    updateDimensions();

    // Listen for viewport resize with debounce
    let timeoutId: number;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(updateDimensions, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const cellSize = GRID_CONFIG.CELL_SIZE;
  const gapSize = GRID_CONFIG.GAP_SIZE;
  const totalCellWidth = cellSize + gapSize;
  
  const cols = Math.floor(dimensions.width / totalCellWidth);
  const rows = Math.floor(dimensions.height / totalCellWidth);

  const verticalLines = Array.from({ length: cols + 1 }, (_, i) => i);
  const horizontalLines = Array.from({ length: rows + 1 }, (_, i) => i);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none opacity-[0.08]">
      {dimensions.width > 0 && (
        <>
          {/* Grid cells */}
          {verticalLines.map((i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-px bg-primary/60"
              style={{ left: i * totalCellWidth }}
            />
          ))}
          
          {horizontalLines.map((i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 h-px bg-primary/60"
              style={{ top: i * totalCellWidth }}
            />
          ))}
          
          {/* Gap zones (darker lines) */}
          {verticalLines.slice(1).map((i) => (
            <div
              key={`gap-v-${i}`}
              className="absolute top-0 bottom-0 bg-border/30"
              style={{ 
                left: i * totalCellWidth - gapSize,
                width: gapSize,
              }}
            />
          ))}
          
          {horizontalLines.slice(1).map((i) => (
            <div
              key={`gap-h-${i}`}
              className="absolute left-0 right-0 bg-border/30"
              style={{ 
                top: i * totalCellWidth - gapSize,
                height: gapSize,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
