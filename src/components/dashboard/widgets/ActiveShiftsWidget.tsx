import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, DollarSign, UserCircle, Award, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { ActiveShiftsConfig } from "@/types/widgetConfigs";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function ActiveShiftsWidget() {
  const { config } = useWidgetConfig<ActiveShiftsConfig>('active-shifts');
  
  const isGridMode = config.viewMode === 'grid';
  const isCompact = isGridMode;
  
  const { data: activeShifts, isLoading, refetch } = useQuery({
    queryKey: ["active-shifts", isGridMode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select(`
          *,
          employees (name, pay_rate)
        `)
        .eq("status", "active")
        .order("clock_in_at", { ascending: false })
        .limit(isGridMode ? 6 : 20);

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
    refetchInterval: config.refreshInterval * 1000,
  });

  const totalLaborCost = activeShifts?.reduce((sum, s) => sum + s.laborCost, 0) || 0;
  const longestShift = activeShifts?.reduce((max, s) => 
    s.hoursWorked > max.hoursWorked ? s : max, activeShifts[0]
  );
  
  const getShiftColor = (hours: number) => {
    if (hours >= 8) return { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30" };
    if (hours >= 4) return { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30" };
    return { bg: "bg-success/10", text: "text-success", border: "border-success/30" };
  };

  // GRID MODE - Ultra compact avatar grid
  if (isGridMode) {
    return (
      <Card className="glass-card p-4 w-full h-full flex flex-col">
        {/* Title Bar */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Active Shifts</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {activeShifts?.length || 0} Active
            </Badge>
            <Button
              onClick={() => refetch()}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Avatar Grid (3×2) */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[64px] rounded-lg" />
              ))}
            </div>
          ) : activeShifts && activeShifts.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 h-full">
              {activeShifts.slice(0, 6).map((shift) => {
                const initials = shift.employees?.name
                  ?.split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || "?";
                const firstName = shift.employees?.name?.split(' ')[0] || "Unknown";
                const shiftColor = getShiftColor(shift.hoursWorked);
                
                return (
                  <div
                    key={shift.id}
                    className="flex flex-col items-center justify-center rounded-lg border bg-card/50 p-2 transition-all hover:bg-card h-[64px]"
                  >
                    <div className="relative mb-1.5">
                      <Avatar className={cn(
                        "h-10 w-10 border-2",
                        shiftColor.border
                      )}>
                        <AvatarFallback className={cn(
                          "text-xs font-semibold",
                          shiftColor.bg,
                          shiftColor.text
                        )}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-success rounded-full border border-background" />
                    </div>
                    <p className="text-xs font-medium line-clamp-1 text-center w-full">
                      {firstName}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <UserCircle className="h-10 w-10 mb-1.5 opacity-50" />
              <p className="text-xs">No shifts</p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // LIST MODE - Detailed view
  return (
    <Card className="glass-card p-4 w-full h-full flex flex-col">
      {/* Title Bar */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Active Shifts</h3>
        <div className="flex items-center gap-2">
          {config.showLaborCost && totalLaborCost > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Cost</p>
              <p className="text-sm font-semibold text-primary">
                RM {totalLaborCost.toFixed(2)}
              </p>
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            {activeShifts?.length || 0} Active
          </Badge>
          <Button
            onClick={() => refetch()}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Total Labor Cost - Only show if enabled */}
      {config.showLaborCost && (
        <div className="p-3 bg-gradient-to-r from-primary/10 to-transparent rounded-lg mb-3 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Labor Cost</p>
            </div>
            <p className="text-xl font-bold text-primary">RM {totalLaborCost.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Active Shifts List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] w-full rounded-lg" />
          ))
        ) : activeShifts && activeShifts.length > 0 ? (
          activeShifts.map((shift) => {
            const shiftColor = getShiftColor(shift.hoursWorked);
            const isLongest = longestShift?.id === shift.id && activeShifts.length > 1;
            
            return (
            <div 
              key={shift.id} 
              className={cn(
                "p-2.5 rounded-lg border transition-all hover:shadow-md h-[52px] flex items-center gap-2.5",
                shiftColor.bg,
                shiftColor.border
              )}
            >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-10 w-10 border-2 border-success">
                    <AvatarFallback className="bg-success/20 text-success font-semibold text-sm">
                      {shift.employees?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-semibold text-sm line-clamp-1">
                        {shift.employees?.name || "Unknown"}
                      </h4>
                      {isLongest && (
                        <Award className="h-3.5 w-3.5 text-warning fill-warning flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs mt-0.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {shift.hoursWorked.toFixed(1)}h
                      </span>
                    </div>
                    {config.showLaborCost && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3 w-3 text-primary" />
                        <span className="font-semibold text-primary">
                          RM {shift.laborCost.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <UserCircle className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No active shifts</p>
          </div>
        )}
      </div>
    </Card>
  );
}
