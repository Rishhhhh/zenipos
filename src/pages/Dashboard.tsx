import { useState, Suspense, lazy } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { WidgetConfigModal } from "@/components/dashboard/WidgetConfigModal";
import { useBentoLayout } from "@/lib/widgets/useBentoLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

const BentoDashboard = lazy(() => import("@/components/dashboard/BentoDashboard"));

export default function Dashboard() {
  const { employee } = useAuth();
  const userRole = (employee?.role as "staff" | "manager" | "owner") || "staff";
  const [configModalWidget, setConfigModalWidget] = useState<string | null>(null);
  const { isMobile } = useDeviceDetection();
  
  const { activeWidgets } = useBentoLayout(userRole, 'desktop');

  return (
    <div 
      className="dashboard-container flex flex-col bg-gradient-to-br from-background via-accent/5 to-secondary/5"
      style={{ height: 'var(--available-height)' }}
    >
      {/* Compact Header - Horizontal Layout */}
      {!isMobile && (
        <div className="flex-none max-w-7xl mx-auto w-full px-4 md:px-6 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Dashboard <span className="text-muted-foreground text-base font-normal">• Welcome back, {employee?.name || "User"} ({userRole.charAt(0).toUpperCase() + userRole.slice(1)})</span>
            </h1>
          </div>
        </div>
      )}

      {/* Bento Dashboard - scrollable content */}
      <div className="flex-1 px-4 md:px-6 overflow-auto">
        <div className="h-full pb-4">
          <Suspense fallback={<Skeleton className="w-full h-full rounded-lg" />}>
            <BentoDashboard onConfigure={setConfigModalWidget} />
          </Suspense>
        </div>
      </div>

      {/* Widget Configuration Modal */}
      <WidgetConfigModal
        widgetId={configModalWidget}
        open={!!configModalWidget}
        onOpenChange={(open) => !open && setConfigModalWidget(null)}
      />

    </div>
  );
}
