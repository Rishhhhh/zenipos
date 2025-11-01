import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load recharts components
const LazyRechartsBarChart = lazy(() =>
  import("recharts").then((module) => ({ default: module.BarChart }))
);
const LazyRechartsBar = lazy(() =>
  import("recharts").then((module) => ({ default: module.Bar }))
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

interface LazyBarChartProps {
  data: any[];
  dataKey: string;
  xAxisKey?: string;
  height?: number | string;
  className?: string;
  fillColor?: string;
}

export function LazyBarChart({
  data,
  dataKey,
  xAxisKey = "name",
  height = 300,
  className,
  fillColor = "hsl(var(--primary))",
}: LazyBarChartProps) {
  return (
    <Suspense fallback={<Skeleton className="w-full" style={{ height }} />}>
      <LazyRechartsResponsiveContainer width="100%" height={height} className={className}>
        <LazyRechartsBarChart data={data}>
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
          <LazyRechartsBar dataKey={dataKey} fill={fillColor} radius={[8, 8, 0, 0]} />
        </LazyRechartsBarChart>
      </LazyRechartsResponsiveContainer>
    </Suspense>
  );
}
