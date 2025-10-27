import { useState, Suspense } from "react";
import { DndContext, closestCenter, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { useAuth } from "@/contexts/AuthContext";
import { SortableWidget } from "@/components/dashboard/SortableWidget";
import { ResizableWidget } from "@/components/dashboard/ResizableWidget";
import { WidgetLibrary } from "@/components/dashboard/WidgetLibrary";
import { WidgetMenu } from "@/components/dashboard/WidgetMenu";
import { WidgetConfigModal } from "@/components/dashboard/WidgetConfigModal";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useWidgetLayout } from "@/lib/widgets/useWidgetLayout";
import { getWidgetById } from "@/lib/widgets/widgetCatalog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { employee } = useAuth();
  const userRole = employee?.role || "cashier";
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [configModalWidget, setConfigModalWidget] = useState<string | null>(null);
  
  const { layout, updateOrder, updateSize, addWidget, removeWidget, resetLayout } = useWidgetLayout();

  // Configure sensors for press-and-hold dragging (800ms)
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { delay: 800, tolerance: 5 }
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 800, tolerance: 5 }
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = layout.widgetOrder.indexOf(active.id as string);
      const newIndex = layout.widgetOrder.indexOf(over.id as string);
      updateOrder(arrayMove(layout.widgetOrder, oldIndex, newIndex));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/5 p-4 md:p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
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
              variant="ghost"
              size="sm"
              onClick={resetLayout}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Widgets Grid with Drag and Drop */}
        <DndContext 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext items={layout.widgetOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[300px]">
              {layout.widgetOrder.map((widgetId, index) => {
                const widgetDef = getWidgetById(widgetId);
                if (!widgetDef) return null;

                const size = layout.widgetSizes[widgetId] || widgetDef.defaultSize;
                const WidgetComponent = widgetDef.component;

                return (
                  <SortableWidget
                    key={widgetId}
                    id={widgetId}
                    index={index}
                  >
                    <ResizableWidget
                      id={widgetId}
                      cols={size.cols}
                      rows={size.rows}
                      onResize={(cols, rows) => updateSize(widgetId, { cols, rows })}
                    >
                      <Suspense fallback={<Skeleton className="h-full w-full" />}>
                        <div className="h-full relative group">
                          <WidgetMenu 
                            widgetId={widgetId}
                            widgetName={widgetDef.name}
                            onConfigure={() => setConfigModalWidget(widgetId)}
                            onDelete={() => removeWidget(widgetId)}
                          />
                          <WidgetComponent />
                        </div>
                      </Suspense>
                    </ResizableWidget>
                  </SortableWidget>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-muted-foreground space-y-1">
          <p>Press and hold (0.8s) any widget to drag • Drag bottom-right corner to resize</p>
          <p>Layout saves automatically per user</p>
        </div>
      </div>

      {/* Widget Library Modal */}
      <WidgetLibrary
        open={showWidgetLibrary}
        onOpenChange={setShowWidgetLibrary}
        userRole={userRole}
        activeWidgets={layout.widgetOrder}
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
