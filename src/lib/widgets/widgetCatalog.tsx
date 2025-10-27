import { 
  ShoppingCart, 
  ChefHat, 
  BarChart3, 
  TrendingUp, 
  Star,
  AlertTriangle,
  DollarSign,
  Users,
  UserPlus,
  Clock,
  Award,
} from "lucide-react";
import { lazy } from "react";

// Lazy load widgets for better performance
const QuickPOSWidget = lazy(() => import("@/components/dashboard/QuickPOSWidget").then(m => ({ default: m.QuickPOSWidget })));
const ActiveOrdersWidget = lazy(() => import("@/components/dashboard/ActiveOrdersWidget").then(m => ({ default: m.ActiveOrdersWidget })));
const SalesWidget = lazy(() => import("@/components/dashboard/SalesWidget").then(m => ({ default: m.SalesWidget })));
const RevenueChartWidget = lazy(() => import("@/components/dashboard/widgets/RevenueChartWidget").then(m => ({ default: m.RevenueChartWidget })));
const TopItemsWidget = lazy(() => import("@/components/dashboard/widgets/TopItemsWidget").then(m => ({ default: m.TopItemsWidget })));
const LowStockWidget = lazy(() => import("@/components/dashboard/widgets/LowStockWidget").then(m => ({ default: m.LowStockWidget })));
const LoyaltyStatsWidget = lazy(() => import("@/components/dashboard/widgets/LoyaltyStatsWidget").then(m => ({ default: m.LoyaltyStatsWidget })));
const ActiveShiftsWidget = lazy(() => import("@/components/dashboard/widgets/ActiveShiftsWidget").then(m => ({ default: m.ActiveShiftsWidget })));

export interface WidgetDefinition {
  id: string;
  component: React.ComponentType;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  roles: ("cashier" | "manager" | "admin")[];
  category: string;
  defaultSize: { cols: number; rows: number };
  capabilities: {
    supportedDisplayTypes: ('chart' | 'table' | 'cards' | 'gauge')[];
    dataType: 'financial' | 'text-list' | 'time-series' | 'status-list';
    hasCompactMode: boolean;
    customSettings?: string[];
  };
}

export const WIDGET_CATALOG: Record<string, WidgetDefinition[]> = {
  pos: [
    {
      id: "quick-pos",
      component: QuickPOSWidget,
      name: "Quick POS",
      description: "Fast checkout with category filters and mini cart",
      icon: ShoppingCart,
      roles: ["cashier", "manager", "admin"],
      category: "pos",
      defaultSize: { cols: 2, rows: 2 },
      capabilities: {
        supportedDisplayTypes: ['cards'],
        dataType: 'text-list',
        hasCompactMode: false,
      },
    },
    {
      id: "active-orders",
      component: ActiveOrdersWidget,
      name: "Active Orders",
      description: "Live view of pending and preparing orders",
      icon: ChefHat,
      roles: ["cashier", "manager", "admin"],
      category: "pos",
      defaultSize: { cols: 1, rows: 1 },
      capabilities: {
        supportedDisplayTypes: ['table', 'cards'],
        dataType: 'status-list',
        hasCompactMode: true,
      },
    },
  ],
  analytics: [
    {
      id: "sales",
      component: SalesWidget,
      name: "Sales Overview",
      description: "Today's sales performance and key metrics",
      icon: BarChart3,
      roles: ["manager", "admin"],
      category: "analytics",
      defaultSize: { cols: 2, rows: 1 },
      capabilities: {
        supportedDisplayTypes: ['cards', 'table'],
        dataType: 'financial',
        hasCompactMode: true,
      },
    },
    {
      id: "revenue-chart",
      component: RevenueChartWidget,
      name: "Revenue Chart",
      description: "Visual revenue trends over time",
      icon: TrendingUp,
      roles: ["manager", "admin"],
      category: "analytics",
      defaultSize: { cols: 2, rows: 1 },
      capabilities: {
        supportedDisplayTypes: ['chart'],
        dataType: 'time-series',
        hasCompactMode: false,
      },
    },
    {
      id: "top-items",
      component: TopItemsWidget,
      name: "Top Selling Items",
      description: "Best performing menu items by sales",
      icon: Star,
      roles: ["manager", "admin"],
      category: "analytics",
      defaultSize: { cols: 1, rows: 1 },
      capabilities: {
        supportedDisplayTypes: ['table', 'cards'],
        dataType: 'text-list',
        hasCompactMode: true,
      },
    },
  ],
  inventory: [
    {
      id: "low-stock",
      component: LowStockWidget,
      name: "Low Stock Alert",
      description: "Items that need reordering",
      icon: AlertTriangle,
      roles: ["manager", "admin"],
      category: "inventory",
      defaultSize: { cols: 1, rows: 1 },
      capabilities: {
        supportedDisplayTypes: ['table', 'cards'],
        dataType: 'status-list',
        hasCompactMode: false,
      },
    },
  ],
  customers: [
    {
      id: "loyalty-stats",
      component: LoyaltyStatsWidget,
      name: "Loyalty Stats",
      description: "Customer loyalty program insights",
      icon: Users,
      roles: ["manager", "admin"],
      category: "customers",
      defaultSize: { cols: 1, rows: 1 },
      capabilities: {
        supportedDisplayTypes: ['cards', 'table'],
        dataType: 'financial',
        hasCompactMode: true,
      },
    },
  ],
  employees: [
    {
      id: "active-shifts",
      component: ActiveShiftsWidget,
      name: "Active Shifts",
      description: "Currently clocked-in employees",
      icon: Clock,
      roles: ["manager", "admin"],
      category: "employees",
      defaultSize: { cols: 1, rows: 1 },
      capabilities: {
        supportedDisplayTypes: ['table', 'cards'],
        dataType: 'status-list',
        hasCompactMode: true,
      },
    },
  ],
};

// Flatten catalog for easy access
export const ALL_WIDGETS = Object.values(WIDGET_CATALOG).flat();

// Get widget by ID
export function getWidgetById(id: string): WidgetDefinition | undefined {
  return ALL_WIDGETS.find(w => w.id === id);
}

// Filter widgets by role
export function getWidgetsByRole(role: "cashier" | "manager" | "admin"): WidgetDefinition[] {
  return ALL_WIDGETS.filter(w => w.roles.includes(role));
}
