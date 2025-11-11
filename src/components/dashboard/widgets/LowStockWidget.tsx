import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LowStock = lazy(() => import("./LowStock"));

export function LowStockWidget() {
  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <LowStock />
    </Suspense>
  );
}
