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
const LaborCostWidget = lazy(() => import("@/components/dashboard/widgets/LaborCostWidget").then(m => ({ default: m.LaborCostWidget })));
const EightySixWidget = lazy(() => import("@/components/dashboard/widgets/EightySixWidget").then(m => ({ default: m.EightySixWidget })));

export interface WidgetDefinition {
  id: string;
  component: React.ComponentType;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  roles: ("cashier" | "manager" | "admin")[];
  category: string;
  defaultSize: { cols: number; rows: number };
  minSize: { width: number; height: number };
  maxSize: { width: number; height: number };
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
      defaultSize: { cols: 10, rows: 10 },
      minSize: { width: 360, height: 360 },
      maxSize: { width: 900, height: 900 },
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
      defaultSize: { cols: 6, rows: 5 },
      minSize: { width: 300, height: 300 },
      maxSize: { width: 720, height: 780 },
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
      defaultSize: { cols: 6, rows: 5 },
      minSize: { width: 300, height: 300 },
      maxSize: { width: 720, height: 540 },
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
      defaultSize: { cols: 8, rows: 5 },
      minSize: { width: 420, height: 300 },
      maxSize: { width: 960, height: 540 },
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
      defaultSize: { cols: 5, rows: 5 },
      minSize: { width: 300, height: 300 },
      maxSize: { width: 540, height: 600 },
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
      defaultSize: { cols: 5, rows: 5 },
      minSize: { width: 300, height: 300 },
      maxSize: { width: 540, height: 540 },
      capabilities: {
        supportedDisplayTypes: ['table', 'cards'],
        dataType: 'status-list',
        hasCompactMode: false,
      },
    },
    {
      id: "eighty-six",
      component: EightySixWidget,
      name: "86 List",
      description: "Items currently out of stock (86'd)",
      icon: AlertTriangle,
      roles: ["cashier", "manager", "admin"],
      category: "inventory",
      defaultSize: { cols: 5, rows: 5 },
      minSize: { width: 300, height: 300 },
      maxSize: { width: 540, height: 540 },
      capabilities: {
        supportedDisplayTypes: ['cards'],
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
      defaultSize: { cols: 5, rows: 5 },
      minSize: { width: 300, height: 300 },
      maxSize: { width: 540, height: 480 },
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
      defaultSize: { cols: 5, rows: 5 },
      minSize: { width: 300, height: 300 },
      maxSize: { width: 540, height: 540 },
      capabilities: {
        supportedDisplayTypes: ['table', 'cards'],
        dataType: 'status-list',
        hasCompactMode: true,
      },
    },
    {
      id: "labor-cost",
      component: LaborCostWidget,
      name: "Labor Cost",
      description: "Real-time labor cost tracking and budget compliance",
      icon: DollarSign,
      roles: ["manager", "admin"],
      category: "employees",
      defaultSize: { cols: 5, rows: 5 },
      minSize: { width: 300, height: 300 },
      maxSize: { width: 540, height: 540 },
      capabilities: {
        supportedDisplayTypes: ['cards'],
        dataType: 'financial',
        hasCompactMode: false,
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
