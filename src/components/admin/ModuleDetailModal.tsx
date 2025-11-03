import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, RefreshCw, LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface Module {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  path: string;
  fetchStats?: () => Promise<any>;
}

interface ModuleDetailModalProps {
  module: Module | null;
  open: boolean;
  onClose: () => void;
}

export function ModuleDetailModal({ module, open, onClose }: ModuleDetailModalProps) {
  const navigate = useNavigate();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['module-stats', module?.id],
    queryFn: module?.fetchStats || (async () => ({})),
    enabled: open && !!module?.fetchStats,
    staleTime: 30000, // 30s cache
  });

  if (!module) return null;

  const Icon = module.icon;

  const handleNavigate = () => {
    navigate(module.path);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass-card">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{module.name}</h2>
            <p className="text-sm text-muted-foreground">{module.description}</p>
          </div>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : stats?.metrics ? (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {stats.metrics.map((metric: any, idx: number) => (
              <Card key={idx} className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                {metric.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
                )}
              </Card>
            ))}
          </div>
        ) : null}

        {/* Chart */}
        {stats?.chartData && stats.chartData.length > 0 && (
          <div className="mb-6 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.1)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button onClick={handleNavigate} className="flex-1">
            Open {module.name}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {module.fetchStats && (
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
