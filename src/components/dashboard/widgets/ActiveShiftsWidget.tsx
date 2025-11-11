import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ActiveShifts = lazy(() => import("./ActiveShifts"));

export function ActiveShiftsWidget() {
  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <ActiveShifts />
    </Suspense>
  );
}
