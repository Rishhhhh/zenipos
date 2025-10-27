import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { cn } from "@/lib/utils";

export function ActiveShiftsWidget() {
  const { config } = useWidgetConfig('active-shifts');
  
  const { data: activeShifts, isLoading } = useQuery({
    queryKey: ["active-shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select(`
          *,
          employees (name, pay_rate)
        `)
        .eq("status", "active")
        .order("clock_in_at", { ascending: false });

      if (error) throw error;

      return data?.map(shift => {
        const clockInTime = new Date(shift.clock_in_at);
        const hoursWorked = (Date.now() - clockInTime.getTime()) / (1000 * 60 * 60);
        const laborCost = hoursWorked * (Number(shift.employees?.pay_rate) || 0);

        return {
          ...shift,
          hoursWorked,
          laborCost,
        };
      });
    },
    refetchInterval: 60 * 1000, // Refresh every minute
  });

  const totalLaborCost = activeShifts?.reduce((sum, s) => sum + s.laborCost, 0) || 0;

  return (
    <Card className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-base">Active Shifts</h3>
        </div>
        {activeShifts && activeShifts.length > 0 && (
          <Badge variant="default" className="bg-success/20 text-success">
            {activeShifts.length} active
          </Badge>
        )}
      </div>

      {/* Total Labor Cost */}
      <div className="p-2 bg-accent/50 rounded-lg mb-3">
        <p className="text-xs text-muted-foreground">Total Labor Cost</p>
        <p className="text-lg font-bold text-primary">RM {totalLaborCost.toFixed(2)}</p>
      </div>

      {/* Active Shifts List */}
      <div className={cn("flex-1 overflow-y-auto", config.displayType === 'table' ? "space-y-1" : "space-y-2")}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))
        ) : activeShifts && activeShifts.length > 0 ? (
          config.displayType === 'cards' ? (
            activeShifts.map((shift) => (
              <div key={shift.id} className={cn("bg-accent/30 rounded-lg", config.compactMode ? "p-1.5" : "p-2")}>
                <div className="flex items-start justify-between mb-1">
                  <p className={cn("font-medium line-clamp-1", config.compactMode ? "text-xs" : "text-sm")}>
                    {shift.employees?.name || "Unknown"}
                  </p>
                  <Badge variant="outline" className="bg-success/10 text-success text-[10px] h-4">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(shift.clock_in_at), { addSuffix: true })}
                  </span>
                  <span className="font-semibold text-primary">
                    RM {shift.laborCost.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-1">
              {activeShifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-1.5 bg-accent/30 rounded text-xs">
                  <span className="font-medium line-clamp-1 flex-1">
                    {shift.employees?.name || "Unknown"}
                  </span>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant="outline" className="bg-success/10 text-success text-[10px] h-4">Active</Badge>
                    <span className="font-semibold text-primary whitespace-nowrap">
                      RM {shift.laborCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No active shifts
          </div>
        )}
      </div>
    </Card>
  );
}
