import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const PendingMods = lazy(() => import("./PendingMods"));

export function PendingModsWidget() {
  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <PendingMods />
    </Suspense>
  );
}
