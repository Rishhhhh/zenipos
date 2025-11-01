import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

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
      <ResponsiveContainer width="100%" height={height} className={className}>
        <BarChart data={data}>
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
          <Bar dataKey={dataKey} fill={fillColor} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Suspense>
  );
}
