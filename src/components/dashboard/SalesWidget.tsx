import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const Sales = lazy(() => import("./Sales"));

export function SalesWidget() {
  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <Sales />
    </Suspense>
  );
}
