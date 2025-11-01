import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load recharts components
const LazyRechartsAreaChart = lazy(() =>
  import("recharts").then((module) => ({ default: module.AreaChart }))
);
const LazyRechartsArea = lazy(() =>
  import("recharts").then((module) => ({ default: module.Area }))
);
const LazyRechartsXAxis = lazy(() =>
  import("recharts").then((module) => ({ default: module.XAxis }))
);
const LazyRechartsYAxis = lazy(() =>
  import("recharts").then((module) => ({ default: module.YAxis }))
);
const LazyRechartsTooltip = lazy(() =>
  import("recharts").then((module) => ({ default: module.Tooltip }))
);
const LazyRechartsCartesianGrid = lazy(() =>
  import("recharts").then((module) => ({ default: module.CartesianGrid }))
);
const LazyRechartsResponsiveContainer = lazy(() =>
  import("recharts").then((module) => ({ default: module.ResponsiveContainer }))
);

interface LazyAreaChartProps {
  data: any[];
  dataKey: string;
  xAxisKey?: string;
  height?: number | string;
  className?: string;
  strokeColor?: string;
  fillColor?: string;
}

export function LazyAreaChart({
  data,
  dataKey,
  xAxisKey = "name",
  height = 300,
  className,
  strokeColor = "hsl(var(--primary))",
  fillColor = "hsl(var(--primary) / 0.2)",
}: LazyAreaChartProps) {
  return (
    <Suspense fallback={<Skeleton className="w-full" style={{ height }} />}>
      <LazyRechartsResponsiveContainer width="100%" height={height} className={className}>
        <LazyRechartsAreaChart data={data}>
          <LazyRechartsCartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <LazyRechartsXAxis
            dataKey={xAxisKey}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <LazyRechartsYAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <LazyRechartsTooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <LazyRechartsArea
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            fill={fillColor}
            strokeWidth={2}
          />
        </LazyRechartsAreaChart>
      </LazyRechartsResponsiveContainer>
    </Suspense>
  );
}
