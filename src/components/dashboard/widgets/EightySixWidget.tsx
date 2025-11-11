import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const EightySix = lazy(() => import("./EightySix"));

export function EightySixWidget() {
  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <EightySix />
    </Suspense>
  );
}
