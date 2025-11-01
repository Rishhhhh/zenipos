import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const RevenueChart = lazy(() => import("./RevenueChart"));

export function RevenueChartWidget() {
  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <RevenueChart />
    </Suspense>
  );
}
