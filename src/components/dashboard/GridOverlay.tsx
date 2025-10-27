import { GRID_CONFIG } from "@/lib/widgets/gridSystem";

export function GridOverlay() {
  const verticalLines = Array.from({ length: GRID_CONFIG.COLS + 1 }, (_, i) => i);
  const horizontalLines = Array.from({ length: GRID_CONFIG.ROWS + 1 }, (_, i) => i);

  return (
    <div className="absolute inset-0 pointer-events-none opacity-10">
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
    </div>
  );
}
