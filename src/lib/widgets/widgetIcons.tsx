import { 
  LayoutDashboard, 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign,
  Clock,
  Award
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export const WIDGET_ICONS: Record<string, LucideIcon> = {
  "quick-pos": ShoppingCart,
  "active-orders": LayoutDashboard,
  "sales": DollarSign,
  "revenue-chart": TrendingUp,
  "low-stock": Package,
  "top-items": TrendingUp,
  "loyalty-stats": Award,
  "active-shifts": Users,
};

export function getWidgetIcon(widgetId: string): LucideIcon {
  return WIDGET_ICONS[widgetId] || LayoutDashboard;
}
