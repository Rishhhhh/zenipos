import {
  LayoutDashboard,
  UtensilsCrossed,
  Grid3x3,
  Tag,
  Package,
  Truck,
  ShoppingCart,
  Users,
  Heart,
  Building,
  Receipt,
  BarChart3,
  TrendingUp,
  FileBarChart,
  BookOpen,
  AlertTriangle,
  Activity,
  Clock,
  Bell,
  UserCog,
  Settings,
  Shield,
  Database,
  Monitor,
  Server,
  Layers,
  NfcIcon,
  Zap,
  Store,
  Brain,
  CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const ADMIN_MODULES = {
  "Core Operations": [
    {
      id: "pos",
      name: "Point of Sale",
      icon: LayoutDashboard,
      path: "/pos",
      description: "Take orders and manage transactions",
      shortcut: "⌘1",
      fetchStats: async () => {
        const { data } = await supabase.from('orders').select('total, created_at', { count: 'exact' });
        const todayOrders = data?.filter(o => 
          new Date(o.created_at).toDateString() === new Date().toDateString()
        ).length || 0;
        return {
          metrics: [
            { label: "Today", value: todayOrders, subtitle: "Orders" },
            { label: "Total", value: data?.length || 0, subtitle: "All Time" },
            { label: "Avg", value: data?.length ? `$${(data.reduce((sum, o) => sum + Number(o.total), 0) / data.length).toFixed(2)}` : "$0", subtitle: "Per Order" },
          ],
        };
      },
    },
    {
      id: "kds",
      name: "Kitchen Display",
      icon: UtensilsCrossed,
      path: "/kds",
      description: "View and manage kitchen orders",
      shortcut: "⌘2",
      fetchStats: async () => {
        const { data } = await supabase.from('orders').select('*', { count: 'exact' }).eq('status', 'pending');
        return {
          metrics: [
            { label: "Pending", value: data?.length || 0, subtitle: "Orders" },
            { label: "Queue", value: data?.length || 0, subtitle: "Items" },
            { label: "Est. Time", value: `${(data?.length || 0) * 5}m`, subtitle: "Minutes" },
          ],
        };
      },
    },
    {
      id: "tables",
      name: "Table Layout",
      icon: Grid3x3,
      path: "/admin/tables",
      description: "Manage restaurant tables and seating",
      shortcut: "⌘3",
    },
  ],

  "Menu & Products": [
    {
      id: "menu",
      name: "Menu Management",
      icon: UtensilsCrossed,
      path: "/admin/menu",
      description: "Manage categories, items, and pricing",
      shortcut: "⌘M",
      fetchStats: async () => {
        const [itemsRes, catsRes] = await Promise.all([
          supabase.from('menu_items').select('*', { count: 'exact' }),
          supabase.from('menu_categories').select('*', { count: 'exact' }),
        ]);
        const avgPrice = itemsRes.data?.reduce((sum, i) => sum + Number(i.price), 0) / (itemsRes.data?.length || 1);
        return {
          metrics: [
            { label: "Items", value: itemsRes.count || 0, subtitle: "Total" },
            { label: "Categories", value: catsRes.count || 0, subtitle: "Active" },
            { label: "Avg Price", value: `$${avgPrice.toFixed(2)}`, subtitle: "Per Item" },
          ],
        };
      },
    },
    {
      id: "modifiers",
      name: "Modifiers",
      icon: Tag,
      path: "/admin/modifiers",
      description: "Manage item modifiers and add-ons",
    },
    {
      id: "promotions",
      name: "Promotions",
      icon: Tag,
      path: "/admin/promotions",
      description: "Create and manage promotional offers",
    },
  ],

  "Inventory & Supply": [
    {
      id: "inventory",
      name: "Inventory",
      icon: Package,
      path: "/admin/inventory",
      description: "Track stock levels and manage ingredients",
      fetchStats: async () => {
        const { data } = await supabase.from('inventory_items').select('*');
        const lowStock = data?.filter(i => i.current_qty < i.reorder_point).length || 0;
        return {
          metrics: [
            { label: "Items", value: data?.length || 0, subtitle: "Total" },
            { label: "Low Stock", value: lowStock, subtitle: "Alert" },
            { label: "Value", value: "$0", subtitle: "Estimated" },
          ],
        };
      },
    },
    {
      id: "suppliers",
      name: "Suppliers",
      icon: Truck,
      path: "/admin/suppliers",
      description: "Manage suppliers and contacts",
    },
    {
      id: "purchase-orders",
      name: "Purchase Orders",
      icon: ShoppingCart,
      path: "/admin/purchase-orders",
      description: "Manage inventory procurement",
    },
  ],

  "People": [
    {
      id: "employees",
      name: "Employees",
      icon: Users,
      path: "/admin/employees",
      description: "Manage staff, roles, and time tracking",
      fetchStats: async () => {
        const { data } = await supabase.from('employees').select('*', { count: 'exact' });
        const active = data?.filter(e => e.active).length || 0;
        return {
          metrics: [
            { label: "Total", value: data?.length || 0, subtitle: "Employees" },
            { label: "Active", value: active, subtitle: "On Duty" },
            { label: "Roles", value: "3", subtitle: "Types" },
          ],
        };
      },
    },
    {
      id: "crm",
      name: "CRM & Loyalty",
      icon: Heart,
      path: "/admin/crm",
      description: "Manage customers and loyalty programs",
      fetchStats: async () => {
        const { data } = await supabase.from('customers').select('*', { count: 'exact' });
        return {
          metrics: [
            { label: "Customers", value: data?.length || 0, subtitle: "Total" },
            { label: "Loyalty", value: "0", subtitle: "Active" },
            { label: "Points", value: "0", subtitle: "Issued" },
          ],
        };
      },
    },
  ],

  "Analytics & Reports": [
    {
      id: "reports",
      name: "Reports",
      icon: TrendingUp,
      path: "/admin/reports",
      description: "View KPI dashboards and generate reports",
      shortcut: "⌘R",
    },
    {
      id: "performance",
      name: "Performance",
      icon: Zap,
      path: "/admin/performance",
      description: "Track page load times and budgets",
    },
    {
      id: "manager",
      name: "Multi-Branch",
      icon: Store,
      path: "/admin/manager",
      description: "Multi-branch analytics and oversight",
    },
  ],

  "System": [
    {
      id: "branches",
      name: "Branches",
      icon: Store,
      path: "/admin/branches",
      description: "Manage multiple locations",
      roleRequired: "owner",
    },
    {
      id: "organization-settings",
      name: "Organization Settings",
      icon: Settings,
      path: "/admin/organization-settings",
      description: "Configure restaurant info, branding, and security",
      roleRequired: "owner",
    },
    {
      id: "ai-history",
      name: "AI History",
      icon: Brain,
      path: "/admin/ai-history",
      description: "View AI assistant interactions",
    },
    {
      id: "system-health",
      name: "System Health",
      icon: Activity,
      path: "/admin/system-health",
      description: "Monitor service status",
    },
    {
      id: "rate-limits",
      name: "Rate Limits",
      icon: Shield,
      path: "/admin/rate-limits",
      description: "Monitor API usage",
    },
    {
      id: "receipts",
      name: "Receipt Templates",
      icon: Settings,
      path: "/admin/receipt-templates",
      description: "Design receipt layouts",
    },
    {
      id: "stations",
      name: "Stations",
      icon: Layers,
      path: "/admin/stations",
      description: "Configure kitchen stations and routing",
    },
    {
      id: "devices",
      name: "Devices",
      icon: Server,
      path: "/admin/devices",
      description: "Manage POS devices and printers",
    },
    {
      id: "nfc-cards",
      name: "NFC Cards",
      icon: CreditCard,
      path: "/admin/nfc-cards",
      description: "Manage NFC table cards",
    },
    {
      id: "marketing-content",
      name: "Marketing Content",
      icon: Monitor,
      path: "/admin/marketing-content",
      description: "Manage customer display content",
    },
    {
      id: "approvals",
      name: "Manager Approvals",
      icon: Shield,
      path: "/admin/approvals",
      description: "Review and approve pending requests",
      badge: "Live",
    },
  ],
};

export const ALL_MODULES = Object.values(ADMIN_MODULES).flat();
