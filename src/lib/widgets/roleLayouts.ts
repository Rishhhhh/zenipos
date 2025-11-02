import { WidgetLayout } from "./useWidgetLayout";
import { WIDGET_SIZE_PRESETS } from "./gridSystem";

// Cashier-optimized layout (7 widgets)
// Priority: Quick POS > Active Orders > 86 List > Low Stock > Active Shifts > Sales > Pending Mods
export const CASHIER_LAYOUT: WidgetLayout = {
  widgetOrder: ["quick-pos", "active-orders", "eighty-six", "low-stock", "active-shifts", "sales", "pending-mods"],
  widgetPositions: {
    // XL: Quick POS - Top-left (primary interaction)
    "quick-pos": { 
      x: 0, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.XL.width, 
      height: WIDGET_SIZE_PRESETS.XL.height, 
      zIndex: 1 
    },
    
    // L: Active Orders - Middle-top
    "active-orders": { 
      x: 660, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.L.width, 
      height: WIDGET_SIZE_PRESETS.L.height, 
      zIndex: 2 
    },
    
    // S: 86 List - Top-right corner
    "eighty-six": { 
      x: 1200, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 3 
    },
    
    // S: Low Stock - Below 86 list
    "low-stock": { 
      x: 1200, 
      y: 300, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 4 
    },
    
    // S: Active Shifts - Below low stock
    "active-shifts": { 
      x: 1200, 
      y: 600, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 5 
    },
    
    // M: Sales - Bottom-left
    "sales": { 
      x: 0, 
      y: 540, 
      width: WIDGET_SIZE_PRESETS.M.width, 
      height: WIDGET_SIZE_PRESETS.M.height, 
      zIndex: 6 
    },
    
    // M: Pending Mods - Bottom-middle
    "pending-mods": { 
      x: 420, 
      y: 540, 
      width: WIDGET_SIZE_PRESETS.M.width, 
      height: WIDGET_SIZE_PRESETS.M.height, 
      zIndex: 7 
    },
  },
};

// Manager-optimized layout (9 widgets)
// Priority: Revenue Chart > Sales > Active Orders > Top Items > Labor Cost > Loyalty > Low Stock > Active Shifts > Pending Mods
export const MANAGER_LAYOUT: WidgetLayout = {
  widgetOrder: ["revenue-chart", "sales", "active-orders", "top-items", "labor-cost", "loyalty-stats", "low-stock", "active-shifts", "pending-mods"],
  widgetPositions: {
    // L: Revenue Chart - Top-left (analytics focus)
    "revenue-chart": { 
      x: 0, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.L.width, 
      height: WIDGET_SIZE_PRESETS.L.height, 
      zIndex: 1 
    },
    
    // M: Sales - Top-middle
    "sales": { 
      x: 540, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.M.width, 
      height: WIDGET_SIZE_PRESETS.M.height, 
      zIndex: 2 
    },
    
    // M: Active Orders - Top-right
    "active-orders": { 
      x: 960, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.M.width, 
      height: WIDGET_SIZE_PRESETS.M.height, 
      zIndex: 3 
    },
    
    // M: Top Items - Middle-left
    "top-items": { 
      x: 0, 
      y: 420, 
      width: WIDGET_SIZE_PRESETS.M.width, 
      height: WIDGET_SIZE_PRESETS.M.height, 
      zIndex: 4 
    },
    
    // S: Labor Cost - Middle-center
    "labor-cost": { 
      x: 420, 
      y: 420, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 5 
    },
    
    // M: Loyalty Stats - Middle-right
    "loyalty-stats": { 
      x: 720, 
      y: 420, 
      width: WIDGET_SIZE_PRESETS.M.width, 
      height: WIDGET_SIZE_PRESETS.M.height, 
      zIndex: 6 
    },
    
    // S: Low Stock - Bottom-left
    "low-stock": { 
      x: 1140, 
      y: 420, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 7 
    },
    
    // S: Active Shifts - Below labor cost
    "active-shifts": { 
      x: 420, 
      y: 720, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 8 
    },
    
    // M: Pending Mods - Bottom-right
    "pending-mods": { 
      x: 720, 
      y: 780, 
      width: WIDGET_SIZE_PRESETS.M.width, 
      height: WIDGET_SIZE_PRESETS.M.height, 
      zIndex: 9 
    },
  },
};

// Admin-optimized layout (10 widgets)
// Priority: Quick POS > Revenue Chart > Active Orders > Sales > Top Items > Labor Cost > Web Vitals > Low Stock > Active Shifts > Loyalty
export const ADMIN_LAYOUT: WidgetLayout = {
  widgetOrder: ["quick-pos", "revenue-chart", "active-orders", "sales", "top-items", "labor-cost", "web-vitals", "low-stock", "active-shifts", "loyalty-stats"],
  widgetPositions: {
    // XL: Quick POS - Top-left
    "quick-pos": { 
      x: 0, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.XL.width, 
      height: WIDGET_SIZE_PRESETS.XL.height, 
      zIndex: 1 
    },
    
    // L: Revenue Chart - Top-middle
    "revenue-chart": { 
      x: 660, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.L.width, 
      height: WIDGET_SIZE_PRESETS.L.height, 
      zIndex: 2 
    },
    
    // M: Active Orders - Top-right
    "active-orders": { 
      x: 1200, 
      y: 0, 
      width: WIDGET_SIZE_PRESETS.M.width, 
      height: WIDGET_SIZE_PRESETS.M.height, 
      zIndex: 3 
    },
    
    // M: Sales - Middle-right
    "sales": { 
      x: 1200, 
      y: 360, 
      width: WIDGET_SIZE_PRESETS.M.width, 
      height: WIDGET_SIZE_PRESETS.M.height, 
      zIndex: 4 
    },
    
    // M: Top Items - Bottom-left
    "top-items": { 
      x: 0, 
      y: 540, 
      width: WIDGET_SIZE_PRESETS.M.width, 
      height: WIDGET_SIZE_PRESETS.M.height, 
      zIndex: 5 
    },
    
    // S: Labor Cost - Bottom-middle-left
    "labor-cost": { 
      x: 420, 
      y: 540, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 6 
    },
    
    // S: Web Vitals - Below labor cost
    "web-vitals": { 
      x: 420, 
      y: 840, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 7 
    },
    
    // S: Low Stock - Bottom-middle
    "low-stock": { 
      x: 720, 
      y: 540, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 8 
    },
    
    // S: Active Shifts - Below low stock
    "active-shifts": { 
      x: 720, 
      y: 840, 
      width: WIDGET_SIZE_PRESETS.S.width, 
      height: WIDGET_SIZE_PRESETS.S.height, 
      zIndex: 9 
    },
    
    // M: Loyalty Stats - Bottom-right
    "loyalty-stats": { 
      x: 1020, 
      y: 720, 
      width: WIDGET_SIZE_PRESETS.M.width, 
      height: WIDGET_SIZE_PRESETS.M.height, 
      zIndex: 10 
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
