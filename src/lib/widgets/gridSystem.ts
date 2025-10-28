export const GRID_CONFIG = {
  // Grid cell size (pixels)
  CELL_SIZE: 80,
  
  // Canvas constraints (match max-w-7xl container)
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 800, // Reduce from 1000px to fit without scrolling
  
  // Calculated grid dimensions
  COLS: 16, // 1280 / 80
  ROWS: 10, // 800 / 80
  
  // Snap threshold (pixels) - how close to snap
  SNAP_THRESHOLD: 40, // Half cell size for "soft" magnetic feel
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
