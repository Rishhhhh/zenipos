import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

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
      <ResponsiveContainer width="100%" height={height} className={className}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey={xAxisKey}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            fill={fillColor}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Suspense>
  );
}
