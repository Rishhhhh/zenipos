import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ActiveOrders = lazy(() => import("./ActiveOrders"));

export function ActiveOrdersWidget() {
  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <ActiveOrders />
    </Suspense>
  );
}
