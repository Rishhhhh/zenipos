import { GRID_CONFIG } from "@/lib/widgets/gridSystem";

interface ResizeTooltipProps {
  width: number;
  height: number;
  isVisible: boolean;
}

export function ResizeTooltip({ width, height, isVisible }: ResizeTooltipProps) {
  if (!isVisible) return null;

  const cols = Math.round(width / GRID_CONFIG.CELL_SIZE);
  const rows = Math.round(height / GRID_CONFIG.CELL_SIZE);

  return (
    <div className="absolute -top-12 right-0 bg-popover text-popover-foreground px-3 py-1.5 rounded-md shadow-lg border text-xs font-medium whitespace-nowrap z-[200] pointer-events-none">
      {cols} × {rows} cells ({width}×{height}px)
    </div>
  );
}
