import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const WebVitals = lazy(() => import("./WebVitals"));

export function WebVitalsWidget() {
  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <WebVitals />
    </Suspense>
  );
}
