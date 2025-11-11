import { useState, Suspense, lazy } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { WidgetLibrary } from "@/components/dashboard/WidgetLibrary";
import { WidgetConfigModal } from "@/components/dashboard/WidgetConfigModal";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useBentoLayout } from "@/lib/widgets/useBentoLayout";
import { Skeleton } from "@/components/ui/skeleton";

const BentoDashboard = lazy(() => import("@/components/dashboard/BentoDashboard"));

export default function Dashboard() {
  const { employee } = useAuth();
  const userRole = (employee?.role as "staff" | "manager" | "owner") || "staff";
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [configModalWidget, setConfigModalWidget] = useState<string | null>(null);
  
  const { activeWidgets, addWidget, resetLayout } = useBentoLayout(userRole, 'desktop');

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-accent/5 to-secondary/5 overflow-hidden">
      {/* Header with max-width constraint */}
      <div className="flex-none max-w-7xl mx-auto w-full px-4 md:px-6 pt-4 md:pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {employee?.name || "User"} • {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWidgetLibrary(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Widget
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetLayout}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Layout
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas spans full viewport width */}
      <div className="flex-1 px-4 md:px-6 overflow-hidden">
        <div className="h-full">
          <Suspense fallback={<Skeleton className="w-full h-full rounded-lg" />}>
            <BentoDashboard onConfigure={setConfigModalWidget} />
          </Suspense>
        </div>
      </div>

      {/* Help Text */}
      <div className="flex-none px-4 md:px-6 pb-4 text-center text-sm text-muted-foreground">
        <p>Widgets arranged in optimized bento grid layout • Click configure to customize</p>
      </div>

      {/* Widget Library Modal */}
      <WidgetLibrary
        open={showWidgetLibrary}
        onOpenChange={setShowWidgetLibrary}
        userRole={userRole}
        activeWidgets={activeWidgets}
        onAddWidget={addWidget}
      />

      {/* Widget Configuration Modal */}
      <WidgetConfigModal
        widgetId={configModalWidget}
        open={!!configModalWidget}
        onOpenChange={(open) => !open && setConfigModalWidget(null)}
      />

    </div>
  );
}
