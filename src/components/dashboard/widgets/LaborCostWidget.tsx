import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LaborCost = lazy(() => import("./LaborCost"));

export function LaborCostWidget() {
  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <LaborCost />
    </Suspense>
  );
}
