import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, RefreshCw, TrendingUp } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KPICards } from "@/components/admin/reports/KPICards";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useModalManager } from "@/hooks/useModalManager";
import { Link } from "react-router-dom";

// LAZY LOAD: Heavy chart components
const SalesHeatmap = lazy(() => import("@/components/admin/reports/SalesHeatmap"));

export default function ReportsDashboard() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const queryClient = useQueryClient();
  const { openModal } = useModalManager();

  // Fetch KPI data
  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpi-dashboard', dateRange],
    queryFn: async () => {
      // Fetch sales by hour for sparkline
      const { data: salesByHour } = await supabase.rpc('get_sales_by_hour' as any, {
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
      }) as any;

      // Fetch COGS data
      const { data: cogsData } = await supabase.rpc('calculate_cogs' as any, {
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
      }) as any;

      // Fetch employee data for labor percentage
      const { data: employeeData } = await supabase.rpc('get_sales_by_employee' as any, {
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
      }) as any;

      // Count voids from audit log
      const { count: voidCount } = await supabase
        .from('audit_log')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'void_item')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      // Count total order items for void rate
      const { count: totalItems } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      const totalSales = (salesByHour as any[])?.reduce((sum: number, h: any) => sum + Number(h.total_sales), 0) || 0;
      const totalOrders = (salesByHour as any[])?.reduce((sum: number, h: any) => sum + h.order_count, 0) || 0;
      const totalHours = Math.max((salesByHour as any[])?.length || 1, 1);
      const totalLaborHours = (employeeData as any[])?.reduce((sum: number, e: any) => sum + Number(e.hours_worked), 0) || 0;
      const totalLaborCost = totalLaborHours * 15; // Assume RM 15/hour average

      return {
        salesPerHour: totalSales / totalHours,
        cogsPercentage: Number(cogsData?.[0]?.cogs_percentage || 0),
        foodCostPercentage: Number(cogsData?.[0]?.food_cost_percentage || 0),
        avgTicket: totalOrders > 0 ? totalSales / totalOrders : 0,
        laborPercentage: totalSales > 0 ? (totalLaborCost / totalSales) * 100 : 0,
        voidRate: totalItems > 0 ? ((voidCount || 0) / totalItems) * 100 : 0,
        sparklineData: {
          sales: (salesByHour as any[])?.map((h: any) => Number(h.total_sales)) || [],
          cogs: (salesByHour as any[])?.map((h: any) => Number(h.total_sales) * 0.35) || [],
        },
      };
    },
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  // Fetch heatmap data
  const { data: heatmapData } = useQuery({
    queryKey: ['sales-heatmap', dateRange],
    queryFn: async () => {
      const { data: byHour } = await supabase.rpc('get_sales_by_hour' as any, {
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
      }) as any;

      const { data: byDay } = await supabase.rpc('get_sales_by_day_of_week' as any, {
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
      }) as any;

      // Combine data into 2D array
      const combined: Array<{ hour: number; day: number; sales: number }> = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const dayData = (byDay as any[])?.find((d: any) => d.day_of_week === day);
          const hourData = (byHour as any[])?.find((h: any) => h.hour === hour);
          
          combined.push({
            hour,
            day,
            sales: hourData && dayData ? Number(hourData.total_sales) / 7 : 0,
          });
        }
      }

      return combined;
    },
  });

  // Fetch top items
  const { data: topItems } = useQuery({
    queryKey: ['top-items', dateRange],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_top_selling_items' as any, {
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
        limit_count: 10,
      }) as any;
      return data || [];
    },
  });

  // Fetch category sales
  const { data: categorySales } = useQuery({
    queryKey: ['category-sales', dateRange],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_sales_by_category' as any, {
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
      }) as any;
      return data || [];
    },
  });

  // Fetch AI insights (disabled temporarily to fix build)
  const aiInsights = null;

  // Real-time updates via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel('reports-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['kpi-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['sales-heatmap'] });
        queryClient.invalidateQueries({ queryKey: ['top-items'] });
        queryClient.invalidateQueries({ queryKey: ['category-sales'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, dateRange]);

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    toast.success('Dashboard refreshed');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
            <p className="text-muted-foreground">
              Real-time KPI dashboard and performance insights
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin">
              <Button variant="outline">Back to Admin</Button>
            </Link>
          </div>
        </div>

        {/* Date Range & Actions */}
        <div className="flex items-center justify-between">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[300px] justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {format(dateRange.from, 'PPP')} - {format(dateRange.to, 'PPP')}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => range?.from && range?.to && setDateRange({ from: range.from, to: range.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => openModal('zReport', {})}>
              Generate Z-Report
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div id="dashboard-content" className="space-y-6">
          {/* KPI Cards */}
          {kpiData && <KPICards data={kpiData} sparklineData={kpiData.sparklineData} />}

          {/* AI Insights */}
          {aiInsights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  AI-Powered Insights
                </CardTitle>
                <CardDescription>Intelligent analysis of your business performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{aiInsights.summary}</p>
                {aiInsights.insights && aiInsights.insights.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Key Insights:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {aiInsights.insights.map((insight: string, i: number) => (
                        <li key={i}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Charts Grid - Temporarily disabled */}
          {/* <div className="grid gap-6 md:grid-cols-2">
            {topItems && <TopItemsChart data={topItems} />}
            {categorySales && <CategorySalesChart data={categorySales} />}
          </div> */}

          {/* Heatmap */}
          {heatmapData && (
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <SalesHeatmap data={heatmapData} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
