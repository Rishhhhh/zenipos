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
  const horizontalPadding = width < 768 ? 48 : 96;
  const availableWidth = width - horizontalPadding;
  
  return {
    width: availableWidth,
    height: Math.max(availableHeight, 600), // Min height 600px
  };
}

// Expanded widget size presets (12 aspect ratios for variety)
export const WIDGET_SIZE_PRESETS = {
  // Compact Sizes (Square/Portrait)
  XS: { width: 200, height: 200, cols: 5, rows: 5 },      // Tiny KPI
  S: { width: 240, height: 240, cols: 6, rows: 6 },       // Small Square
  S_TALL: { width: 200, height: 320, cols: 5, rows: 8 },  // Narrow List
  
  // Medium Sizes (Balanced)
  M: { width: 320, height: 280, cols: 8, rows: 7 },       // Standard
  M_WIDE: { width: 400, height: 240, cols: 10, rows: 6 }, // Wide Chart
  M_TALL: { width: 280, height: 360, cols: 7, rows: 9 },  // Tall List
  
  // Large Sizes (Featured)
  L: { width: 440, height: 320, cols: 11, rows: 8 },      // Large Chart
  L_WIDE: { width: 560, height: 280, cols: 14, rows: 7 }, // Wide Dashboard
  L_TALL: { width: 360, height: 480, cols: 9, rows: 12 }, // Tall Feature
  
  // Extra Large (Hero Widgets)
  XL: { width: 560, height: 440, cols: 14, rows: 11 },    // Hero Interactive
  XL_WIDE: { width: 680, height: 360, cols: 17, rows: 9 },// Ultra Wide
  XXL: { width: 680, height: 560, cols: 17, rows: 14 },   // Mega Widget
} as const;

export type WidgetSize = keyof typeof WIDGET_SIZE_PRESETS;

export function getWidgetDimensions(preset: WidgetSize) {
  return WIDGET_SIZE_PRESETS[preset];
}

export const GRID_CONFIG = {
  // Grid cell size (pixels) - smaller for more flexibility
  CELL_SIZE: 40,
  
  // Gap between widgets (breathing room)
  GAP_SIZE: 16,
  
  // Minimum widget size
  MIN_WIDGET_SIZE: 2,
  
  // Responsive breakpoint detection
  get BREAKPOINT() {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    if (width < 1440) return 'laptop';
    return 'desktop';
  },
  
  // Dynamic canvas constraints based on viewport
  get CANVAS_WIDTH() {
    return getViewportDimensions().width;
  },
  get CANVAS_HEIGHT() {
    return getViewportDimensions().height;
  },
  
  // Calculated grid dimensions (dynamic, responsive)
  get COLS() {
    const width = this.CANVAS_WIDTH;
    if (width < 768) return 12;   // Mobile: 12 cols
    if (width < 1024) return 18;  // Tablet: 18 cols
    if (width < 1440) return 24;  // Laptop: 24 cols
    return 30;                     // Desktop: 30 cols
  },
  get ROWS() {
    return Math.floor(this.CANVAS_HEIGHT / (this.CELL_SIZE + this.GAP_SIZE));
  },
  
  // Snap threshold (pixels) - half of cell size for "soft" magnetic feel
  SNAP_THRESHOLD: 20, // Half of 40px
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
