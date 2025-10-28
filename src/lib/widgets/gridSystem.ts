/**
 * Get viewport-aware canvas dimensions
 * Uses available viewport space minus header/padding
 */
export function getViewportDimensions() {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const height = typeof window !== 'undefined' ? window.innerHeight : 800;
  
  // Account for padding and header (approx 200px total)
  const availableHeight = height - 200;
  const availableWidth = Math.min(width - 48, 1920); // Max width 1920px, minus padding
  
  return {
    width: availableWidth,
    height: availableHeight,
  };
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
 * Snap widget size to grid cell multiples (for cleaner layouts)
 */
export function snapSizeToGrid(width: number, height: number) {
  return {
    width: snapToGrid(width),
    height: snapToGrid(height),
  };
}

/**
 * Snap size to grid in real-time (for live resize preview)
 */
export function snapSizeToGridRealtime(width: number, height: number) {
  return snapSizeToGrid(width, height);
}

/**
 * Check if widget is at maximum size
 */
export function isAtMaxSize(width: number, height: number, maxWidth: number, maxHeight: number): boolean {
  return width >= maxWidth || height >= maxHeight;
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
