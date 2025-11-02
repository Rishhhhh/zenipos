/**
 * Get viewport-aware canvas dimensions
 * Uses available viewport space minus header/padding
 */
export function getViewportDimensions() {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const height = typeof window !== 'undefined' ? window.innerHeight : 800;
  
  // Account for header + padding (approx 200px top, 96px bottom for dock)
  const availableHeight = height - 296;
  
  // Account for horizontal padding only (24px × 2 on mobile, 48px × 2 on desktop)
  // No max-width constraint - allow full viewport width
  const horizontalPadding = width < 768 ? 48 : 96;
  const availableWidth = width - horizontalPadding;
  
  return {
    width: availableWidth,
    height: Math.max(availableHeight, 600), // Min height 600px
  };
}

// Fixed widget size presets (aligned to grid)
export const WIDGET_SIZE_PRESETS = {
  S: { width: 240, height: 240, cols: 4, rows: 4 },    // Compact KPIs
  M: { width: 360, height: 300, cols: 6, rows: 5 },    // Standard lists
  L: { width: 480, height: 360, cols: 8, rows: 6 },    // Expanded views
  XL: { width: 600, height: 480, cols: 10, rows: 8 },  // Interactive
} as const;

export type WidgetSize = keyof typeof WIDGET_SIZE_PRESETS;

export function getWidgetDimensions(preset: WidgetSize) {
  return WIDGET_SIZE_PRESETS[preset];
}

export const GRID_CONFIG = {
  // Grid cell size (pixels) - 75% of original 80px
  CELL_SIZE: 60,
  
  // Dynamic canvas constraints based on viewport
  get CANVAS_WIDTH() {
    return getViewportDimensions().width;
  },
  get CANVAS_HEIGHT() {
    return getViewportDimensions().height;
  },
  
  // Calculated grid dimensions (dynamic)
  get COLS() {
    return Math.floor(this.CANVAS_WIDTH / this.CELL_SIZE);
  },
  get ROWS() {
    return Math.floor(this.CANVAS_HEIGHT / this.CELL_SIZE);
  },
  
  // Snap threshold (pixels) - half of cell size for "soft" magnetic feel
  SNAP_THRESHOLD: 30, // Half of 60px
};

/**
 * Snap a pixel value to the nearest grid point
 */
export function snapToGrid(value: number, cellSize: number = GRID_CONFIG.CELL_SIZE): number {
  return Math.round(value / cellSize) * cellSize;
}

/**
 * Snap position with soft magnetic behavior
 * Only snaps if within threshold, otherwise allows free movement
 */
export function softSnapPosition(x: number, y: number) {
  const snappedX = snapToGrid(x);
  const snappedY = snapToGrid(y);
  
  const deltaX = Math.abs(x - snappedX);
  const deltaY = Math.abs(y - snappedY);
  
  return {
    x: deltaX <= GRID_CONFIG.SNAP_THRESHOLD ? snappedX : x,
    y: deltaY <= GRID_CONFIG.SNAP_THRESHOLD ? snappedY : y,
  };
}

/**
 * Calculate which grid boxes a widget occupies
 */
export function calculateOccupiedBoxes(
  x: number, 
  y: number, 
  width: number, 
  height: number
): { startCol: number; endCol: number; startRow: number; endRow: number; totalBoxes: number } {
  const startCol = Math.floor(x / GRID_CONFIG.CELL_SIZE);
  const endCol = Math.ceil((x + width) / GRID_CONFIG.CELL_SIZE);
  const startRow = Math.floor(y / GRID_CONFIG.CELL_SIZE);
  const endRow = Math.ceil((y + height) / GRID_CONFIG.CELL_SIZE);
  
  const totalBoxes = (endCol - startCol) * (endRow - startRow);
  
  return { startCol, endCol, startRow, endRow, totalBoxes };
}

/**
 * Constrain widget position to canvas bounds
 */
export function constrainToCanvas(
  x: number, 
  y: number, 
  width: number, 
  height: number
): { x: number; y: number } {
  const maxX = GRID_CONFIG.CANVAS_WIDTH - width;
  const maxY = GRID_CONFIG.CANVAS_HEIGHT - height;
  
  return {
    x: Math.max(0, Math.min(x, maxX)),
    y: Math.max(0, Math.min(y, maxY)),
  };
}

/**
 * Calculate grid cells from pixel dimensions
 */
export function calculateGridCells(width: number, height: number) {
  return {
    cols: Math.round(width / GRID_CONFIG.CELL_SIZE),
    rows: Math.round(height / GRID_CONFIG.CELL_SIZE),
  };
}
