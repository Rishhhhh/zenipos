import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  UtensilsCrossed, 
  Users, 
  Settings,
  TrendingUp,
  Tag,
  Package,
  Brain,
  Store,
  Activity,
  Zap,
  Shield
} from "lucide-react";

export default function Admin() {
  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [categoriesRes, itemsRes, ordersRes] = await Promise.all([
        supabase.from('menu_categories').select('*', { count: 'exact', head: true }),
        supabase.from('menu_items').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total', { count: 'exact' }),
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

      return {
        categories: categoriesRes.count || 0,
        items: itemsRes.count || 0,
        orders: ordersRes.count || 0,
        revenue: totalRevenue,
      };
    },
  });

  return (
    <div className="kiosk-layout p-8 pb-32 overflow-y-auto bg-gradient-to-br from-background via-accent/10 to-secondary/10">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header with blur effect */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            Restaurant Command Center
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your restaurant operations from one place
          </p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-foreground">{stats?.orders}</p>
                </div>
                <ShoppingCart className="h-10 w-10 text-primary" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Revenue</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${stats?.revenue.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-success" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-accent/20 to-accent/10 border-accent/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Menu Items</p>
                  <p className="text-3xl font-bold text-foreground">{stats?.items}</p>
                </div>
                <UtensilsCrossed className="h-10 w-10 text-primary" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-secondary/20 to-secondary/10 border-secondary/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Categories</p>
                  <p className="text-3xl font-bold text-foreground">{stats?.categories}</p>
                </div>
                <LayoutDashboard className="h-10 w-10 text-primary" />
              </div>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link to="/pos">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <LayoutDashboard className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Point of Sale</h3>
              <p className="text-muted-foreground">
                Take orders and manage transactions
              </p>
            </Card>
          </Link>

          <Link to="/kds">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <UtensilsCrossed className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Kitchen Display</h3>
              <p className="text-muted-foreground">
                View and manage kitchen orders
              </p>
            </Card>
          </Link>

          <Link to="/admin/menu">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <UtensilsCrossed className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Menu Management</h3>
              <p className="text-muted-foreground">
                Manage categories, items, and pricing
              </p>
            </Card>
          </Link>
        </div>

        {/* Management Tools */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link to="/admin/promotions">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <Tag className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Promotions</h3>
              <p className="text-muted-foreground">
                Create and manage promotional offers
              </p>
            </Card>
          </Link>

          <Link to="/admin/inventory">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <Package className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Inventory</h3>
              <p className="text-muted-foreground">
                Track stock levels and manage ingredients
              </p>
            </Card>
          </Link>

          <Link to="/admin/crm">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">CRM & Loyalty</h3>
              <p className="text-muted-foreground">
                Manage customers and loyalty programs
              </p>
            </Card>
          </Link>
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Link to="/admin/branches">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <Store className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Branch Management</h3>
              <p className="text-muted-foreground">
                Manage multiple locations and access control
              </p>
            </Card>
          </Link>

          <Link to="/admin/manager">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Manager Dashboard</h3>
              <p className="text-muted-foreground">
                Multi-branch analytics and oversight
              </p>
            </Card>
          </Link>

          <Link to="/admin/employees">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Employee Management</h3>
              <p className="text-muted-foreground">
                Manage staff, roles, and time tracking
              </p>
            </Card>
          </Link>

          <Link to="/admin/reports">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Analytics & Reports</h3>
              <p className="text-muted-foreground">
                View KPI dashboards and generate reports
              </p>
            </Card>
          </Link>

          <Link to="/admin/ai-history">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <Brain className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">AI Command History</h3>
              <p className="text-muted-foreground">
                View all AI assistant interactions and approvals
              </p>
            </Card>
          </Link>

          <Link to="/admin/system-health">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <Activity className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">System Health</h3>
              <p className="text-muted-foreground">
                Monitor service status and uptime
              </p>
            </Card>
          </Link>

          <Link to="/admin/performance">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Performance Metrics</h3>
              <p className="text-muted-foreground">
                Track page load times and budgets
              </p>
            </Card>
          </Link>

          <Link to="/admin/rate-limits">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Rate Limiting</h3>
              <p className="text-muted-foreground">
                Monitor API usage and abuse prevention
              </p>
            </Card>
          </Link>

          <Link to="/admin/suppliers">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <Package className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Suppliers</h3>
              <p className="text-muted-foreground">
                Manage suppliers and contacts
              </p>
            </Card>
          </Link>

          <Link to="/admin/purchase-orders">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <ShoppingCart className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Purchase Orders</h3>
              <p className="text-muted-foreground">
                Manage inventory procurement
              </p>
            </Card>
          </Link>

          <Link to="/admin/receipt-templates">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <Settings className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Receipt Templates</h3>
              <p className="text-muted-foreground">
                Design receipt and ticket layouts
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
