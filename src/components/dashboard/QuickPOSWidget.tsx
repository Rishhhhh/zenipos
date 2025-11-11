import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const QuickPOS = lazy(() => import("./QuickPOS"));

export function QuickPOSWidget() {
  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <QuickPOS />
    </Suspense>
  );
}
