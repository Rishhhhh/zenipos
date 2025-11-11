import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const TopItems = lazy(() => import("./TopItems"));

export function TopItemsWidget() {
  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <TopItems />
    </Suspense>
  );
}
