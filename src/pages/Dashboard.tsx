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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/5 pb-24">
      {/* Header with max-width constraint */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-6 mb-6">
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
      <div className="px-4 md:px-6">
        <Suspense fallback={<Skeleton className="w-full h-[600px] rounded-lg" />}>
          <BentoDashboard onConfigure={setConfigModalWidget} />
        </Suspense>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-muted-foreground space-y-1">
          <p>Widgets arranged in optimized bento grid layout for your role</p>
          <p>Click configure to customize • Click widget to open full view</p>
        </div>
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
