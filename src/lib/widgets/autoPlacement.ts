import { WidgetPosition } from "./useWidgetLayout";
import { GRID_CONFIG } from "./gridSystem";

interface Size {
  cols: number;
  rows: number;
}

/**
 * Find an empty grid space for a new widget
 * Scans left-to-right, top-to-bottom for the first available spot
 */
export function findEmptyGridSpace(
  existingWidgets: Record<string, WidgetPosition>,
  requiredSize: Size
): { x: number; y: number } {
  const cellSize = GRID_CONFIG.CELL_SIZE;
  const gapSize = GRID_CONFIG.GAP_SIZE;
  const totalCellSize = cellSize + gapSize;
  const requiredWidth = requiredSize.cols * cellSize + (requiredSize.cols - 1) * gapSize;
  const requiredHeight = requiredSize.rows * cellSize + (requiredSize.rows - 1) * gapSize;

  // Create a grid map to track occupied cells
  const gridMap: boolean[][] = Array(GRID_CONFIG.ROWS)
    .fill(false)
    .map(() => Array(GRID_CONFIG.COLS).fill(false));

  // Mark occupied cells (account for gaps)
  Object.values(existingWidgets).forEach((pos) => {
    const startCol = Math.floor(pos.x / totalCellSize);
    const endCol = Math.ceil((pos.x + (pos.width || 0)) / totalCellSize);
    const startRow = Math.floor(pos.y / totalCellSize);
    const endRow = Math.ceil((pos.y + (pos.height || 0)) / totalCellSize);

    for (let row = startRow; row < endRow && row < GRID_CONFIG.ROWS; row++) {
      for (let col = startCol; col < endCol && col < GRID_CONFIG.COLS; col++) {
        gridMap[row][col] = true;
      }
    }
  });

  // Scan for empty space
  for (let row = 0; row <= GRID_CONFIG.ROWS - requiredSize.rows; row++) {
    for (let col = 0; col <= GRID_CONFIG.COLS - requiredSize.cols; col++) {
      let canFit = true;

      // Check if this position can fit the widget
      for (let r = row; r < row + requiredSize.rows && canFit; r++) {
        for (let c = col; c < col + requiredSize.cols && canFit; c++) {
          if (gridMap[r][c]) {
            canFit = false;
          }
        }
      }

      if (canFit) {
        return {
          x: col * totalCellSize,
          y: row * totalCellSize,
        };
      }
    }
  }

  // No space found - place at top-left with high z-index (user must rearrange)
  return { x: 0, y: 0 };
}

/**
 * Check if a widget overlaps with any existing widgets
 */
export function hasOverlap(
  position: WidgetPosition,
  existingWidgets: Record<string, WidgetPosition>,
  excludeId?: string
): boolean {
  const x1 = position.x;
  const y1 = position.y;
  const x2 = x1 + (position.width || 0);
  const y2 = y1 + (position.height || 0);

  for (const [id, pos] of Object.entries(existingWidgets)) {
    if (id === excludeId) continue;

    const ox1 = pos.x;
    const oy1 = pos.y;
    const ox2 = ox1 + (pos.width || 0);
    const oy2 = oy1 + (pos.height || 0);

    // Check for overlap
    if (!(x2 <= ox1 || x1 >= ox2 || y2 <= oy1 || y1 >= oy2)) {
      return true;
    }
  }

  return false;
}
