import { WidgetLayout } from "./useWidgetLayout";
import { WIDGET_SIZE_PRESETS } from "./gridSystem";

// Cashier-optimized layout (6 widgets) - Asymmetric, operational focus
// Priority: Quick POS > Active Orders > 86 List > Sales > Active Shifts > Low Stock
export const CASHIER_LAYOUT: WidgetLayout = {
  widgetOrder: ["quick-pos", "active-orders", "eighty-six", "sales", "active-shifts", "low-stock"],
  widgetPositions: {
    // XL: Quick POS - Top-left (primary interaction, hero)
    "quick-pos": { 
      x: 0, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.XL.width, 
      height: WIDGET_SIZE_PRESETS.XL.height, 
      zIndex: 1 
    },
    
    // L_TALL: Active Orders - Top-middle (portrait shows more orders)
    "active-orders": { 
      x: 576, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.L_TALL.width, 
      height: WIDGET_SIZE_PRESETS.L_TALL.height, 
      zIndex: 2 
    },
    
    // S_TALL: 86 List - Top-right corner (narrow alert list)
    "eighty-six": { 
      x: 952, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.S_TALL.width, 
      height: WIDGET_SIZE_PRESETS.S_TALL.height, 
      zIndex: 3 
    },
    
    // M_WIDE: Sales - Bottom-left (wide for 3-metric row)
    "sales": { 
      x: 0, 
      y: 456, 
      width: WIDGET_SIZE_PRESETS.M_WIDE.width, 
      height: WIDGET_SIZE_PRESETS.M_WIDE.height, 
      zIndex: 4 
    },
    
    // S: Active Shifts - Bottom-middle (square for 2-3 employee cards)
    "active-shifts": { 
      x: 416, 
      y: 456, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 5 
    },
    
    // S_TALL: Low Stock - Bottom-middle-right (narrow list format)
    "low-stock": { 
      x: 672, 
      y: 456, 
      width: WIDGET_SIZE_PRESETS.S_TALL.width, 
      height: WIDGET_SIZE_PRESETS.S_TALL.height, 
      zIndex: 6 
    },
  },
};

// Manager-optimized layout (10 widgets) - Chart-focused, asymmetric analytics
// Priority: Revenue Chart > Sales > Top Items > Active Orders > Loyalty > Labor Cost > Active Shifts > Pending Mods > Low Stock
export const MANAGER_LAYOUT: WidgetLayout = {
  widgetOrder: ["revenue-chart", "sales", "top-items", "active-orders", "loyalty-stats", "labor-cost", "active-shifts", "pending-mods", "low-stock"],
  widgetPositions: {
    // L_WIDE: Revenue Chart - Top-left (wide for time-series data)
    "revenue-chart": { 
      x: 0, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.L_WIDE.width, 
      height: WIDGET_SIZE_PRESETS.L_WIDE.height, 
      zIndex: 1 
    },
    
    // M_WIDE: Sales - Top-right (wide 3-metric layout)
    "sales": { 
      x: 576, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.M_WIDE.width, 
      height: WIDGET_SIZE_PRESETS.M_WIDE.height, 
      zIndex: 2 
    },
    
    // M_TALL: Top Items - Top-far-right (tall list shows more items)
    "top-items": { 
      x: 992, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.M_TALL.width, 
      height: WIDGET_SIZE_PRESETS.M_TALL.height, 
      zIndex: 3 
    },
    
    // L_WIDE: Active Orders - Middle-left (wide card view)
    "active-orders": { 
      x: 0, 
      y: 296, 
      width: WIDGET_SIZE_PRESETS.L_WIDE.width, 
      height: WIDGET_SIZE_PRESETS.L_WIDE.height, 
      zIndex: 4 
    },
    
    // M: Loyalty Stats - Middle-right (compact square for KPIs)
    "loyalty-stats": { 
      x: 576, 
      y: 256, 
      width: WIDGET_SIZE_PRESETS.M.width, 
      height: WIDGET_SIZE_PRESETS.M.height, 
      zIndex: 5 
    },
    
    // S: Labor Cost - Below sales (single KPI focus)
    "labor-cost": { 
      x: 576, 
      y: 552, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 6 
    },
    
    // S: Active Shifts - Beside labor cost
    "active-shifts": { 
      x: 832, 
      y: 552, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 7 
    },
    
    // M_TALL: Pending Mods - Bottom-left (tall scrollable list)
    "pending-mods": { 
      x: 0, 
      y: 592, 
      width: WIDGET_SIZE_PRESETS.M_TALL.width, 
      height: WIDGET_SIZE_PRESETS.M_TALL.height, 
      zIndex: 8 
    },
    
    // S_TALL: Low Stock - Bottom-middle (narrow alert list)
    "low-stock": { 
      x: 296, 
      y: 592, 
      width: WIDGET_SIZE_PRESETS.S_TALL.width, 
      height: WIDGET_SIZE_PRESETS.S_TALL.height, 
      zIndex: 9 
    },
  },
};

// Admin-optimized layout (11 widgets) - Comprehensive view, all data types
// Priority: Quick POS > Revenue Chart > Active Orders > Sales > Top Items > Labor Cost > Web Vitals > Low Stock > 86 List > Active Shifts > Loyalty
export const ADMIN_LAYOUT: WidgetLayout = {
  widgetOrder: ["quick-pos", "revenue-chart", "active-orders", "sales", "top-items", "labor-cost", "web-vitals", "low-stock", "eighty-six", "active-shifts", "loyalty-stats"],
  widgetPositions: {
    // XL: Quick POS - Top-left (hero widget)
    "quick-pos": { 
      x: 0, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.XL.width, 
      height: WIDGET_SIZE_PRESETS.XL.height, 
      zIndex: 1 
    },
    
    // L_WIDE: Revenue Chart - Top-middle (wide chart)
    "revenue-chart": { 
      x: 576, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.L_WIDE.width, 
      height: WIDGET_SIZE_PRESETS.L_WIDE.height, 
      zIndex: 2 
    },
    
    // L_TALL: Active Orders - Top-right (portrait mode)
    "active-orders": { 
      x: 1152, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.L_TALL.width, 
      height: WIDGET_SIZE_PRESETS.L_TALL.height, 
      zIndex: 3 
    },
    
    // M_WIDE: Sales - Below revenue (wide 3-metric)
    "sales": { 
      x: 576, 
      y: 296, 
      width: WIDGET_SIZE_PRESETS.M_WIDE.width, 
      height: WIDGET_SIZE_PRESETS.M_WIDE.height, 
      zIndex: 4 
    },
    
    // M_TALL: Top Items - Bottom-left (tall list)
    "top-items": { 
      x: 0, 
      y: 456, 
      width: WIDGET_SIZE_PRESETS.M_TALL.width, 
      height: WIDGET_SIZE_PRESETS.M_TALL.height, 
      zIndex: 5 
    },
    
    // S: Labor Cost - Below top items start
    "labor-cost": { 
      x: 296, 
      y: 456, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 6 
    },
    
    // M: Web Vitals - Beside labor cost (slightly larger for 2x2 grid)
    "web-vitals": { 
      x: 552, 
      y: 552, 
      width: WIDGET_SIZE_PRESETS.M.width, 
      height: WIDGET_SIZE_PRESETS.M.height, 
      zIndex: 7 
    },
    
    // S_TALL: Low Stock - Bottom-middle (narrow list)
    "low-stock": { 
      x: 888, 
      y: 552, 
      width: WIDGET_SIZE_PRESETS.S_TALL.width, 
      height: WIDGET_SIZE_PRESETS.S_TALL.height, 
      zIndex: 8 
    },
    
    // S_TALL: 86 List - Bottom-far-right (narrow alert)
    "eighty-six": { 
      x: 1104, 
      y: 496, 
      width: WIDGET_SIZE_PRESETS.S_TALL.width, 
      height: WIDGET_SIZE_PRESETS.S_TALL.height, 
      zIndex: 9 
    },
    
    // S: Active Shifts - Below labor cost
    "active-shifts": { 
      x: 296, 
      y: 712, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 10 
    },
    
    // M: Loyalty Stats - Bottom-far-right
    "loyalty-stats": { 
      x: 1320, 
      y: 496, 
      width: WIDGET_SIZE_PRESETS.M.width, 
      height: WIDGET_SIZE_PRESETS.M.height, 
      zIndex: 11 
    },
  },
};

// Get layout based on user role
export function getLayoutForRole(role: string): WidgetLayout {
  switch (role?.toLowerCase()) {
    case 'cashier':
      return CASHIER_LAYOUT;
    case 'manager':
      return MANAGER_LAYOUT;
    case 'admin':
      return ADMIN_LAYOUT;
    default:
      return CASHIER_LAYOUT;
  }
}
