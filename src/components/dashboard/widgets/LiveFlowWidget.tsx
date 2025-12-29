import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LiveFlow = lazy(() => import("./LiveFlow"));

export function LiveFlowWidget() {
  return (
    <Suspense fallback={<Skeleton className="h-full w-full rounded-lg" />}>
      <LiveFlow />
    </Suspense>
  );
}
