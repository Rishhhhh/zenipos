import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LoyaltyStats = lazy(() => import("./LoyaltyStats"));

export function LoyaltyStatsWidget() {
  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <LoyaltyStats />
    </Suspense>
  );
}
