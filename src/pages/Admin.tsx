import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, TrendingUp, UtensilsCrossed, LayoutDashboard, Search } from "lucide-react";
import { CompactModuleCard } from "@/components/admin/CompactModuleCard";
import { ModuleDetailModal } from "@/components/admin/ModuleDetailModal";
import { AdminSearchCommand } from "@/components/admin/AdminSearchCommand";
import { ADMIN_MODULES } from '@/lib/admin/moduleRegistry';
import { useCountUp } from "@/hooks/useCountUp";
import { SimulationPanel } from '@/components/admin/SimulationPanel';
import { useState, useEffect } from "react";

export default function Admin() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats-enhanced'],
    queryFn: async () => {
      const [categoriesRes, itemsRes, ordersRes] = await Promise.all([
        supabase.from('menu_categories').select('*', { count: 'exact', head: true }),
        supabase.from('menu_items').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total', { count: 'exact' }),
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const sparklineData = [20, 25, 30, 28, 35, 40, 45];

      return {
        categories: categoriesRes.count || 0,
        items: itemsRes.count || 0,
        orders: ordersRes.count || 0,
        revenue: totalRevenue,
        sparklineData,
      };
    },
  });

  const ordersCount = useCountUp(stats?.orders || 0);
  const itemsCount = useCountUp(stats?.items || 0);
  const categoriesCount = useCountUp(stats?.categories || 0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="kiosk-layout p-6 pb-32 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">Admin Center</h1>
            <p className="text-sm text-muted-foreground">Manage operations • Press ⌘K to search</p>
          </div>
          <Button variant="outline" onClick={() => setCommandOpen(true)} className="glass">
            <Search className="mr-2 h-4 w-4" />
            Quick Search
            <kbd className="ml-2 px-2 py-1 text-xs bg-muted rounded">⌘K</kbd>
          </Button>
        </div>

        <SimulationPanel />

        {isLoading ? (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card className="p-4 glass-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-foreground">{ordersCount}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">+12%</span>
                  </div>
                </div>
                <div className="text-right">
                  <ShoppingCart className="h-6 w-6 text-primary mb-2" />
                  <Sparkline data={stats?.sparklineData || []} width={60} height={20} />
                </div>
              </div>
            </Card>

            <Card className="p-4 glass-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                  <p className="text-3xl font-bold text-foreground">${stats?.revenue.toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">+8%</span>
                  </div>
                </div>
                <div className="text-right">
                  <TrendingUp className="h-6 w-6 text-success mb-2" />
                  <Sparkline data={stats?.sparklineData || []} width={60} height={20} />
                </div>
              </div>
            </Card>

            <Card className="p-4 glass-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Menu Items</p>
                  <p className="text-3xl font-bold text-foreground">{itemsCount}</p>
                </div>
                <div className="text-right">
                  <UtensilsCrossed className="h-6 w-6 text-primary mb-2" />
                  <Sparkline data={stats?.sparklineData || []} width={60} height={20} />
                </div>
              </div>
            </Card>

            <Card className="p-4 glass-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Categories</p>
                  <p className="text-3xl font-bold text-foreground">{categoriesCount}</p>
                </div>
                <div className="text-right">
                  <LayoutDashboard className="h-6 w-6 text-primary mb-2" />
                  <Sparkline data={stats?.sparklineData || []} width={60} height={20} />
                </div>
              </div>
            </Card>
          </div>
        )}

        {Object.entries(ADMIN_MODULES).map(([category, modules]) => (
          <div key={category} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-8 bg-primary rounded" />
              <h2 className="text-lg font-semibold text-foreground">{category}</h2>
              <span className="text-xs text-muted-foreground">({modules.length})</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {modules.map((module) => (
                <CompactModuleCard key={module.id} module={module} onClick={() => setSelectedModule(module)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <AdminSearchCommand open={commandOpen} onOpenChange={setCommandOpen} />
      <ModuleDetailModal module={selectedModule} open={!!selectedModule} onClose={() => setSelectedModule(null)} />
    </div>
  );
}
