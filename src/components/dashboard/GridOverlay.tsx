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

  const cols = Math.floor(dimensions.width / GRID_CONFIG.CELL_SIZE);
  const rows = Math.floor(dimensions.height / GRID_CONFIG.CELL_SIZE);

  const verticalLines = Array.from({ length: cols + 1 }, (_, i) => i);
  const horizontalLines = Array.from({ length: rows + 1 }, (_, i) => i);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none opacity-10">
      {dimensions.width > 0 && (
        <>
          {/* Vertical lines */}
          {verticalLines.map((i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-px bg-primary"
              style={{ left: i * GRID_CONFIG.CELL_SIZE }}
            />
          ))}
          
          {/* Horizontal lines */}
          {horizontalLines.map((i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 h-px bg-primary"
              style={{ top: i * GRID_CONFIG.CELL_SIZE }}
            />
          ))}
        </>
      )}
    </div>
  );
}
