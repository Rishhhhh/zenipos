import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MagicBentoProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
  threshold?: {
    warning: number;
    danger: number;
  };
  subtitle?: string;
  icon?: React.ReactNode;
}

const MagicBento = React.forwardRef<HTMLDivElement, MagicBentoProps>(
  ({ className, title, value, trend, sparklineData, threshold, subtitle, icon, ...props }, ref) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    const getStatusColor = () => {
      if (!threshold || typeof numericValue !== 'number') return 'default';
      
      if (numericValue >= threshold.danger) return 'danger';
      if (numericValue >= threshold.warning) return 'warning';
      return 'success';
    };

    const statusColor = getStatusColor();

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md",
          statusColor === 'danger' && "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20",
          statusColor === 'warning' && "border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20",
          statusColor === 'success' && "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight">{value}</h3>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              {icon}
            </div>
          )}
        </div>

        {trend && (
          <div className="mt-4 flex items-center gap-2">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : trend.value === 0 ? (
              <Minus className="h-4 w-4 text-gray-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-green-600" : trend.value === 0 ? "text-gray-500" : "text-red-600"
            )}>
              {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">vs last period</span>
          </div>
        )}

        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4 h-8">
            <Sparkline data={sparklineData} />
          </div>
        )}
      </div>
    );
  }
);

MagicBento.displayName = "MagicBento";

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="opacity-50">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary"
      />
    </svg>
  );
}

export { MagicBento };
