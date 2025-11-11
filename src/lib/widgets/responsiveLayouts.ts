import { WidgetLayout } from "./useWidgetLayout";
import { WIDGET_SIZE_PRESETS } from "./gridSystem";

/**
 * Responsive layouts for mobile and tablet breakpoints
 * Mobile: 12-col grid, vertical stacking, full width
 * Tablet: 18-col grid, 2-column layout
 */

// MOBILE LAYOUTS (< 768px) - Vertical stacking
export const MOBILE_CASHIER_LAYOUT: WidgetLayout = {
  widgetOrder: ["quick-pos", "active-orders", "sales", "eighty-six", "active-shifts", "low-stock"],
  widgetPositions: {
    "quick-pos": { x: 0, y: 0, width: 440, height: 360, zIndex: 1 },
    "active-orders": { x: 0, y: 376, width: 440, height: 320, zIndex: 2 },
    "sales": { x: 0, y: 712, width: 440, height: 240, zIndex: 3 },
    "eighty-six": { x: 0, y: 968, width: 440, height: 280, zIndex: 4 },
    "active-shifts": { x: 0, y: 1264, width: 440, height: 240, zIndex: 5 },
    "low-stock": { x: 0, y: 1520, width: 440, height: 280, zIndex: 6 },
  },
};

export const MOBILE_MANAGER_LAYOUT: WidgetLayout = {
  widgetOrder: ["revenue-chart", "sales", "top-items", "active-orders", "loyalty-stats", "labor-cost", "active-shifts", "pending-mods", "low-stock"],
  widgetPositions: {
    "revenue-chart": { x: 0, y: 0, width: 440, height: 240, zIndex: 1 },
    "sales": { x: 0, y: 256, width: 440, height: 240, zIndex: 2 },
    "top-items": { x: 0, y: 512, width: 440, height: 320, zIndex: 3 },
    "active-orders": { x: 0, y: 848, width: 440, height: 320, zIndex: 4 },
    "loyalty-stats": { x: 0, y: 1184, width: 440, height: 280, zIndex: 5 },
    "labor-cost": { x: 0, y: 1480, width: 440, height: 240, zIndex: 6 },
    "active-shifts": { x: 0, y: 1736, width: 440, height: 240, zIndex: 7 },
    "pending-mods": { x: 0, y: 1992, width: 440, height: 320, zIndex: 8 },
    "low-stock": { x: 0, y: 2328, width: 440, height: 280, zIndex: 9 },
  },
};

export const MOBILE_ADMIN_LAYOUT: WidgetLayout = {
  widgetOrder: ["quick-pos", "revenue-chart", "active-orders", "sales", "top-items", "labor-cost", "web-vitals", "low-stock", "eighty-six", "active-shifts", "loyalty-stats"],
  widgetPositions: {
    "quick-pos": { x: 0, y: 0, width: 440, height: 360, zIndex: 1 },
    "revenue-chart": { x: 0, y: 376, width: 440, height: 240, zIndex: 2 },
    "active-orders": { x: 0, y: 632, width: 440, height: 320, zIndex: 3 },
    "sales": { x: 0, y: 968, width: 440, height: 240, zIndex: 4 },
    "top-items": { x: 0, y: 1224, width: 440, height: 320, zIndex: 5 },
    "labor-cost": { x: 0, y: 1560, width: 440, height: 240, zIndex: 6 },
    "web-vitals": { x: 0, y: 1816, width: 440, height: 280, zIndex: 7 },
    "low-stock": { x: 0, y: 2112, width: 440, height: 280, zIndex: 8 },
    "eighty-six": { x: 0, y: 2408, width: 440, height: 280, zIndex: 9 },
    "active-shifts": { x: 0, y: 2704, width: 440, height: 240, zIndex: 10 },
    "loyalty-stats": { x: 0, y: 2960, width: 440, height: 280, zIndex: 11 },
  },
};

// TABLET LAYOUTS (768px - 1024px) - 2-column grid
export const TABLET_CASHIER_LAYOUT: WidgetLayout = {
  widgetOrder: ["quick-pos", "active-orders", "sales", "eighty-six", "active-shifts", "low-stock"],
  widgetPositions: {
    "quick-pos": { x: 0, y: 0, width: 348, height: 320, zIndex: 1 },
    "active-orders": { x: 364, y: 0, width: 348, height: 400, zIndex: 2 },
    "sales": { x: 0, y: 336, width: 348, height: 240, zIndex: 3 },
    "eighty-six": { x: 364, y: 416, width: 200, height: 280, zIndex: 4 },
    "active-shifts": { x: 0, y: 592, width: 240, height: 240, zIndex: 5 },
    "low-stock": { x: 256, y: 592, width: 200, height: 280, zIndex: 6 },
  },
};

export const TABLET_MANAGER_LAYOUT: WidgetLayout = {
  widgetOrder: ["revenue-chart", "sales", "top-items", "active-orders", "loyalty-stats", "labor-cost", "active-shifts", "pending-mods", "low-stock"],
  widgetPositions: {
    "revenue-chart": { x: 0, y: 0, width: 468, height: 240, zIndex: 1 },
    "sales": { x: 484, y: 0, width: 400, height: 240, zIndex: 2 },
    "top-items": { x: 0, y: 256, width: 280, height: 320, zIndex: 3 },
    "active-orders": { x: 296, y: 256, width: 360, height: 400, zIndex: 4 },
    "loyalty-stats": { x: 672, y: 256, width: 320, height: 280, zIndex: 5 },
    "labor-cost": { x: 0, y: 592, width: 240, height: 240, zIndex: 6 },
    "active-shifts": { x: 256, y: 672, width: 240, height: 240, zIndex: 7 },
    "pending-mods": { x: 512, y: 552, width: 280, height: 320, zIndex: 8 },
    "low-stock": { x: 808, y: 552, width: 200, height: 280, zIndex: 9 },
  },
};

export const TABLET_ADMIN_LAYOUT: WidgetLayout = {
  widgetOrder: ["quick-pos", "revenue-chart", "active-orders", "sales", "top-items", "labor-cost", "web-vitals", "low-stock", "eighty-six", "active-shifts", "loyalty-stats"],
  widgetPositions: {
    "quick-pos": { x: 0, y: 0, width: 468, height: 360, zIndex: 1 },
    "revenue-chart": { x: 484, y: 0, width: 468, height: 240, zIndex: 2 },
    "active-orders": { x: 0, y: 376, width: 360, height: 400, zIndex: 3 },
    "sales": { x: 376, y: 256, width: 400, height: 240, zIndex: 4 },
    "top-items": { x: 792, y: 256, width: 280, height: 320, zIndex: 5 },
    "labor-cost": { x: 376, y: 512, width: 240, height: 240, zIndex: 6 },
    "web-vitals": { x: 632, y: 512, width: 320, height: 280, zIndex: 7 },
    "low-stock": { x: 968, y: 592, width: 200, height: 280, zIndex: 8 },
    "eighty-six": { x: 0, y: 792, width: 200, height: 280, zIndex: 9 },
    "active-shifts": { x: 216, y: 792, width: 240, height: 240, zIndex: 10 },
    "loyalty-stats": { x: 472, y: 808, width: 320, height: 280, zIndex: 11 },
  },
};

// Get responsive layout based on breakpoint and role
export function getResponsiveLayout(breakpoint: string, role: string): WidgetLayout | null {
  if (breakpoint === 'mobile') {
    switch (role?.toLowerCase()) {
      case 'staff': return MOBILE_CASHIER_LAYOUT;
      case 'manager': return MOBILE_MANAGER_LAYOUT;
      case 'owner': return MOBILE_ADMIN_LAYOUT;
      default: return MOBILE_CASHIER_LAYOUT;
    }
  }
  
  if (breakpoint === 'tablet') {
    switch (role?.toLowerCase()) {
      case 'staff': return TABLET_CASHIER_LAYOUT;
      case 'manager': return TABLET_MANAGER_LAYOUT;
      case 'owner': return TABLET_ADMIN_LAYOUT;
      default: return TABLET_CASHIER_LAYOUT;
    }
  }
  
  // Desktop/laptop uses standard roleLayouts.ts
  return null;
}
