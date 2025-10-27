import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, DollarSign, UserCircle, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { ActiveShiftsConfig } from "@/types/widgetConfigs";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function ActiveShiftsWidget() {
  const { config } = useWidgetConfig<ActiveShiftsConfig>('active-shifts');
  
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
  const longestShift = activeShifts?.reduce((max, s) => s.hoursWorked > max.hoursWorked ? s : max, activeShifts[0]);
  
  const getShiftColor = (hours: number) => {
    if (hours >= 8) return { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30" };
    if (hours >= 4) return { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30" };
    return { bg: "bg-success/10", text: "text-success", border: "border-success/30" };
  };

  return (
    <Card className="glass-card p-5 min-h-[300px] min-w-[350px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Active Shifts</h3>
        </div>
        {activeShifts && activeShifts.length > 0 && (
          <Badge variant="default" className="bg-success/20 text-success">
            {activeShifts.length} active
          </Badge>
        )}
      </div>

      {/* Total Labor Cost */}
      <div className="p-3 bg-gradient-to-r from-primary/10 to-transparent rounded-lg mb-3 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Labor Cost</p>
          </div>
          <p className="text-xl font-bold text-primary">RM {totalLaborCost.toFixed(2)}</p>
        </div>
      </div>

      {/* Active Shifts List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))
        ) : activeShifts && activeShifts.length > 0 ? (
          activeShifts.map((shift) => {
            const shiftColor = getShiftColor(shift.hoursWorked);
            const isLongest = longestShift?.id === shift.id && activeShifts.length > 1;
            
            return (
              <div 
                key={shift.id} 
                className={cn(
                  "p-3 rounded-lg border transition-all hover:shadow-md",
                  shiftColor.bg,
                  shiftColor.border
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-success">
                      <AvatarFallback className="bg-success/20 text-success font-semibold">
                        {shift.employees?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background animate-pulse" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-sm line-clamp-1">
                          {shift.employees?.name || "Unknown"}
                        </h4>
                        {isLongest && (
                          <Award className="h-3.5 w-3.5 text-warning fill-warning" />
                        )}
                      </div>
                      <Badge variant="outline" className="bg-success/20 text-success text-xs h-5 border-success/30">
                        Active
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {shift.hoursWorked.toFixed(1)}h worked
                        </span>
                      </div>
                      {config.showLaborCost && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-primary" />
                          <span className="font-semibold text-primary">
                            RM {shift.laborCost.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Started {formatDistanceToNow(new Date(shift.clock_in_at), { addSuffix: true })}
                    </p>
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
