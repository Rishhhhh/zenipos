export interface WidgetBounds {
  id: string;
  col: number;
  row: number;
  cols: number;
  rows: number;
}

/**
 * Check if a proposed widget size would overlap with any existing widgets
 */
export function checkCollision(
  proposedCols: number,
  proposedRows: number,
  widgetId: string,
  allWidgets: WidgetBounds[]
): boolean {
  const widget = allWidgets.find(w => w.id === widgetId);
  if (!widget) return false;

  // Create bounding box for proposed size
  const proposedBox = {
    left: widget.col,
    right: widget.col + proposedCols,
    top: widget.row,
    bottom: widget.row + proposedRows,
  };

  // Check against all other widgets
  for (const other of allWidgets) {
    if (other.id === widgetId) continue;

    const otherBox = {
      left: other.col,
      right: other.col + other.cols,
      top: other.row,
      bottom: other.row + other.rows,
    };

    // Check for overlap
    const overlaps = !(
      proposedBox.right <= otherBox.left ||
      proposedBox.left >= otherBox.right ||
      proposedBox.bottom <= otherBox.top ||
      proposedBox.top >= otherBox.bottom
    );

    if (overlaps) return true;
  }

  return false;
}

/**
 * Auto-shrink widget to maximum size that fits without colliding
 * Priority: preserve height, shrink width first
 */
export function shrinkToMaxFit(
  cols: number,
  rows: number,
  widgetId: string,
  allWidgets: WidgetBounds[]
): { cols: number; rows: number } {
  let shrunk = { cols, rows };

  // Try shrinking columns first (preserve height preference)
  while (shrunk.cols > 1 && checkCollision(shrunk.cols, shrunk.rows, widgetId, allWidgets)) {
    shrunk.cols--;
  }

  // Then shrink rows if still colliding
  while (shrunk.rows > 1 && checkCollision(shrunk.cols, shrunk.rows, widgetId, allWidgets)) {
    shrunk.rows--;
  }

  return shrunk;
}

/**
 * Calculate grid position for each widget based on order
 */
export function calculateGridPositions(
  widgetOrder: string[],
  widgetSizes: Record<string, { cols: number; rows: number }>
): WidgetBounds[] {
  const bounds: WidgetBounds[] = [];
  let currentRow = 0;
  let currentCol = 0;
  const maxCols = 4; // Grid has 4 columns

  for (const id of widgetOrder) {
    const size = widgetSizes[id] || { cols: 1, rows: 1 };

    // Check if widget fits in current row
    if (currentCol + size.cols > maxCols) {
      // Move to next row
      currentRow++;
      currentCol = 0;
    }

    bounds.push({
      id,
      col: currentCol,
      row: currentRow,
      cols: size.cols,
      rows: size.rows,
    });

    currentCol += size.cols;
  }

  return bounds;
}
