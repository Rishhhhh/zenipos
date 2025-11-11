/**
 * Bento Grid System - Core Types & Responsive Templates
 * Replaces pixel-based gridSystem.ts with CSS Grid-based layouts
 */

export type BentoArea = 
  | '1x1' | '1x2' | '1x3'  // Single column (narrow)
  | '2x1' | '2x2' | '2x3'  // Double column (medium)
  | '3x1' | '3x2' | '3x3'  // Triple column (wide)
  | '4x1' | '4x2' | '4x3'; // Quad column (extra wide)

export type BentoBreakpoint = 'mobile' | 'tablet' | 'desktop';

export interface BentoGridTemplate {
  areas: string[][];           // CSS Grid template areas
  columns: string;             // e.g., "repeat(4, 1fr)"
  rows: string;                // e.g., "repeat(3, minmax(200px, 1fr))"
  gap: string;                 // e.g., "1rem"
  minHeight: string;           // Minimum height for grid
}

export interface BentoWidgetPosition {
  id: string;
  area: string;                // Grid area name (e.g., "hero", "sales")
  colSpan: number;             // Number of columns to span
  rowSpan: number;             // Number of rows to span
  isMinimized?: boolean;       // State management
}

/**
 * Desktop Grid Template (4 columns)
 * Primary layout for large screens
 */
export const DESKTOP_GRID_TEMPLATE: BentoGridTemplate = {
  columns: 'repeat(4, 1fr)',
  rows: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1rem',
  minHeight: '800px',
  areas: [
    ['hero', 'hero', 'sales', 'orders'],
    ['hero', 'hero', 'revenue', 'orders'],
    ['shifts', 'labor', 'revenue', 'items'],
    ['low-stock', 'low-stock', 'analytics', 'analytics']
  ]
};

/**
 * Tablet Grid Template (2 columns)
 * Optimized for medium screens
 */
export const TABLET_GRID_TEMPLATE: BentoGridTemplate = {
  columns: 'repeat(2, 1fr)',
  rows: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '0.875rem',
  minHeight: '600px',
  areas: [
    ['hero', 'hero'],
    ['sales', 'orders'],
    ['revenue', 'revenue'],
    ['shifts', 'labor']
  ]
};

/**
 * Mobile Grid Template (1 column)
 * Vertical stack for small screens
 */
export const MOBILE_GRID_TEMPLATE: BentoGridTemplate = {
  columns: '1fr',
  rows: 'repeat(auto-fit, minmax(200px, auto))',
  gap: '0.75rem',
  minHeight: 'auto',
  areas: [
    ['hero'],
    ['sales'],
    ['orders'],
    ['revenue'],
    ['shifts']
  ]
};

/**
 * Get grid template based on breakpoint
 */
export function getBentoTemplate(breakpoint: BentoBreakpoint): BentoGridTemplate {
  switch (breakpoint) {
    case 'desktop':
      return DESKTOP_GRID_TEMPLATE;
    case 'tablet':
      return TABLET_GRID_TEMPLATE;
    case 'mobile':
      return MOBILE_GRID_TEMPLATE;
    default:
      return DESKTOP_GRID_TEMPLATE;
  }
}

/**
 * Calculate area dimensions from BentoArea type
 */
export function getAreaDimensions(area: BentoArea): { cols: number; rows: number } {
  const [cols, rows] = area.split('x').map(Number);
  return { cols, rows };
}

/**
 * Detect current breakpoint based on window width
 */
export function detectBreakpoint(): BentoBreakpoint {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Generate CSS Grid area string from position
 */
export function generateGridArea(position: BentoWidgetPosition): string {
  return position.area;
}

/**
 * Convert grid template areas to CSS string
 */
export function areasToCSS(areas: string[][]): string {
  return areas.map(row => `"${row.join(' ')}"`).join('\n    ');
}

/**
 * Bento Grid Configuration
 */
export const BENTO_CONFIG = {
  CANVAS_MIN_HEIGHT: 800,
  CANVAS_MAX_WIDTH: 1920,
  WIDGET_MIN_HEIGHT: 200,
  WIDGET_MIN_WIDTH: 300,
  GAP_SIZE: 16,
  BORDER_RADIUS: 20,
  TRANSITION_DURATION: '0.3s',
  ANIMATION_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
