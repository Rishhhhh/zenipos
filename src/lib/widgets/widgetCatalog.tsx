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
  Activity,
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
const PendingModsWidget = lazy(() => import("@/components/dashboard/widgets/PendingModsWidget").then(m => ({ default: m.PendingModsWidget })));
const WebVitalsWidget = lazy(() => import("@/components/dashboard/widgets/WebVitalsWidget").then(m => ({ default: m.WebVitalsWidget })));

export interface WidgetDefinition {
  id: string;
  component: React.ComponentType;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  roles: ("staff" | "manager" | "owner")[];
  category: string;
  fixedSize: 'XS' | 'S' | 'S_TALL' | 'M' | 'M_WIDE' | 'M_TALL' | 'L' | 'L_WIDE' | 'L_TALL' | 'XL' | 'XL_WIDE' | 'XXL';
  defaultSize: { cols: number; rows: number };
  moduleRoute: string; // Route to navigate when "Open in Full View" clicked
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
      roles: ["staff", "manager", "owner"],
      category: "pos",
      fixedSize: 'XL',
      defaultSize: { cols: 14, rows: 11 },
      moduleRoute: "/pos",
      capabilities: {
        supportedDisplayTypes: ['cards'],
        dataType: 'text-list',
        hasCompactMode: true,
      },
    },
    {
      id: "active-orders",
      component: ActiveOrdersWidget,
      name: "Active Orders",
      description: "Live view of pending and preparing orders",
      icon: ChefHat,
      roles: ["staff", "manager", "owner"],
      category: "pos",
      fixedSize: 'L_TALL',
      defaultSize: { cols: 9, rows: 12 },
      moduleRoute: "/kds",
      capabilities: {
        supportedDisplayTypes: ['table', 'cards'],
        dataType: 'status-list',
        hasCompactMode: true,
      },
    },
    {
      id: "pending-mods",
      component: PendingModsWidget,
      name: "Pending Approvals",
      description: "Order modifications awaiting manager approval",
      icon: AlertTriangle,
      roles: ["manager", "owner"],
      category: "pos",
      fixedSize: 'M_TALL',
      defaultSize: { cols: 7, rows: 9 },
      moduleRoute: "/admin/pending-modifications",
      capabilities: {
        supportedDisplayTypes: ['cards'],
        dataType: 'status-list',
        hasCompactMode: false,
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
      roles: ["manager", "owner"],
      category: "analytics",
      fixedSize: 'M_WIDE',
      defaultSize: { cols: 10, rows: 6 },
      moduleRoute: "/admin/reports",
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
      roles: ["manager", "owner"],
      category: "analytics",
      fixedSize: 'L_WIDE',
      defaultSize: { cols: 14, rows: 7 },
      moduleRoute: "/admin/reports",
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
      roles: ["manager", "owner"],
      category: "analytics",
      fixedSize: 'M_TALL',
      defaultSize: { cols: 7, rows: 9 },
      moduleRoute: "/admin/reports",
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
      roles: ["manager", "owner"],
      category: "inventory",
      fixedSize: 'S_TALL',
      defaultSize: { cols: 5, rows: 8 },
      moduleRoute: "/admin/inventory",
      capabilities: {
        supportedDisplayTypes: ['table', 'cards'],
        dataType: 'status-list',
        hasCompactMode: true,
      },
    },
    {
      id: "eighty-six",
      component: EightySixWidget,
      name: "86 List",
      description: "Items currently out of stock (86'd)",
      icon: AlertTriangle,
      roles: ["staff", "manager", "owner"],
      category: "inventory",
      fixedSize: 'S_TALL',
      defaultSize: { cols: 5, rows: 8 },
      moduleRoute: "/admin/eighty-six",
      capabilities: {
        supportedDisplayTypes: ['cards'],
        dataType: 'status-list',
        hasCompactMode: true,
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
      roles: ["manager", "owner"],
      category: "customers",
      fixedSize: 'M',
      defaultSize: { cols: 8, rows: 7 },
      moduleRoute: "/admin/crm",
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
      roles: ["manager", "owner"],
      category: "employees",
      fixedSize: 'S',
      defaultSize: { cols: 4, rows: 4 },
      moduleRoute: "/admin/shift-management",
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
      roles: ["manager", "owner"],
      category: "employees",
      fixedSize: 'S',
      defaultSize: { cols: 4, rows: 4 },
      moduleRoute: "/admin/employees",
      capabilities: {
        supportedDisplayTypes: ['cards'],
        dataType: 'financial',
        hasCompactMode: true,
      },
    },
  ],
  performance: [
    {
      id: "web-vitals",
      component: WebVitalsWidget,
      name: "Core Web Vitals",
      description: "Monitor LCP, FID, CLS, and TTI performance metrics",
      icon: Activity,
      roles: ["owner"],
      category: "performance",
      fixedSize: 'M',
      defaultSize: { cols: 8, rows: 7 },
      moduleRoute: "/admin/performance",
      capabilities: {
        supportedDisplayTypes: ['cards'],
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
export function getWidgetsByRole(role: "staff" | "manager" | "owner"): WidgetDefinition[] {
  return ALL_WIDGETS.filter(w => w.roles.includes(role));
}
