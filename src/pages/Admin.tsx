import { lazy, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { batchQuery } from "@/lib/api/batcher";
import { ShoppingCart, TrendingUp, UtensilsCrossed, LayoutDashboard, Search, Activity, ChevronDown } from "lucide-react";
import { CompactModuleCard } from "@/components/admin/CompactModuleCard";
import { AdminSearchCommand } from "@/components/admin/AdminSearchCommand";
import { ADMIN_MODULES } from '@/lib/admin/moduleRegistry';
import { useCountUp } from "@/hooks/useCountUp";
import { RealtimeMonitor } from '@/components/admin/RealtimeMonitor';
import { LiveRestaurantFlow } from '@/components/admin/LiveRestaurantFlow';
import { useState, useEffect } from "react";
import { useRealtimeTable } from '@/lib/realtime/RealtimeService';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { getGridClasses, getGapClasses, getPaddingClasses } from '@/lib/utils/responsiveGrid';
import { cn } from '@/lib/utils';
import { useQueryConfig } from '@/hooks/useQueryConfig';

// LAZY LOAD: Heavy modals
const ModuleDetailModal = lazy(() => import("@/components/admin/ModuleDetailModal"));

export default function Admin() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const { device, isMobile } = useDeviceDetection();
  const queryConfig = useQueryConfig();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin-stats-enhanced'],
    queryFn: async () => {
      // Use batched queries to reduce API calls
      const [categoriesRes, itemsRes, ordersRes] = await Promise.all([
        batchQuery('menu_categories', '*'),
        batchQuery('menu_items', '*'),
        batchQuery('orders', 'total'),
      ]);

      const totalRevenue = ordersRes?.reduce((sum: number, o: any) => sum + Number(o.total), 0) || 0;
      const sparklineData = [20, 25, 30, 28, 35, 40, 45];

      return {
        categories: categoriesRes?.length || 0,
        items: itemsRes?.length || 0,
        orders: ordersRes?.length || 0,
        revenue: totalRevenue,
        sparklineData,
      };
    },
    refetchInterval: queryConfig.refetchInterval.normal,
    staleTime: queryConfig.staleTime.normal,
  });

  // Real-time subscription using unified service
  useRealtimeTable('orders', () => refetch(), { event: 'INSERT' });

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

  // Responsive classes
  const statsGridClass = getGridClasses('statsCards', device);
  const moduleGridClass = getGridClasses('adminModules', device);
  const gapClass = getGapClasses(device);
  const paddingClass = getPaddingClasses(device);

  return (
    <div className={cn("admin-container", paddingClass)}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={cn("font-bold mb-1 text-foreground", isMobile ? "text-xl" : "text-3xl")}>
              Admin Center
            </h1>
            {!isMobile && (
              <p className="text-sm text-muted-foreground">Manage operations • Press ⌘K to search</p>
            )}
          </div>
          <Button 
            variant="outline" 
            onClick={() => setCommandOpen(true)} 
            size={isMobile ? "icon" : "default"}
            className="glass"
          >
            <Search className={cn(isMobile ? "h-4 w-4" : "mr-2 h-4 w-4")} />
            {!isMobile && (
              <>
                Quick Search
                <kbd className="ml-2 px-2 py-1 text-xs bg-muted rounded">⌘K</kbd>
              </>
            )}
          </Button>
        </div>

        {/* Live Restaurant Flow - Real-time order tracking */}
        <Card className={cn(isMobile ? "p-3 mb-4" : "p-6 mb-8")}>
          <LiveRestaurantFlow />
        </Card>

        {isLoading ? (
          <div className={cn("grid mb-6", statsGridClass, gapClass)}>
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <div className={cn("grid mb-6", statsGridClass, gapClass)}>
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
          <div key={category} className={cn(isMobile ? "mb-4" : "mb-8")}>
            <div className={cn("flex items-center gap-2", isMobile ? "mb-2" : "mb-3")}>
              <div className={cn("h-1 bg-primary rounded", isMobile ? "w-4" : "w-8")} />
              <h2 className={cn("font-semibold text-foreground", isMobile ? "text-sm" : "text-lg")}>
                {category}
              </h2>
              <span className="text-xs text-muted-foreground">({modules.length})</span>
            </div>
            <div className={cn("grid", moduleGridClass, gapClass)}>
              {modules.map((module) => (
                <CompactModuleCard key={module.id} module={module} onClick={() => setSelectedModule(module)} />
              ))}
            </div>
          </div>
        ))}

        {/* System Health Monitor - Collapsible at bottom */}
        <Collapsible defaultOpen={false} className="mt-8">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System Health & Realtime Monitor
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <RealtimeMonitor />
          </CollapsibleContent>
        </Collapsible>
      </div>

      <AdminSearchCommand open={commandOpen} onOpenChange={setCommandOpen} />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ModuleDetailModal module={selectedModule} open={!!selectedModule} onClose={() => setSelectedModule(null)} />
      </Suspense>
    </div>
  );
}
