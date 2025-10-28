import { useState, Suspense } from "react";
import { DndContext, DragEndEvent, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useAuth } from "@/contexts/AuthContext";
import { DraggableWidget } from "@/components/dashboard/DraggableWidget";
import { WidgetLibrary } from "@/components/dashboard/WidgetLibrary";
import { WidgetMenu } from "@/components/dashboard/WidgetMenu";
import { WidgetConfigModal } from "@/components/dashboard/WidgetConfigModal";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useWidgetLayout } from "@/lib/widgets/useWidgetLayout";
import { getWidgetById } from "@/lib/widgets/widgetCatalog";
import { Skeleton } from "@/components/ui/skeleton";
import { haptics } from "@/lib/haptics";
import { softSnapPosition, constrainToCanvas, GRID_CONFIG } from "@/lib/widgets/gridSystem";
import { GridOverlay } from "@/components/dashboard/GridOverlay";

export default function Dashboard() {
  const { employee } = useAuth();
  const userRole = employee?.role || "cashier";
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [configModalWidget, setConfigModalWidget] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  const { layout, updateOrder, updatePosition, bringToFront, addWidget, removeWidget, resetLayout, toggleMinimize, toggleMaximize } = useWidgetLayout();

  // Configure sensors for press-and-hold dragging (500ms)
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { delay: 500, tolerance: 5 }
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 500, tolerance: 5 }
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    const widgetId = event.active.id as string;
    setActiveDragId(widgetId);
    bringToFront(widgetId);
    haptics.medium();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const widgetId = active.id as string;
    const currentPos = layout.widgetPositions[widgetId];
    
    setActiveDragId(null);
    
    if (currentPos) {
      const rawX = currentPos.x + delta.x;
      const rawY = currentPos.y + delta.y;
      
      // Apply soft magnetic snapping
      const snapped = softSnapPosition(rawX, rawY);
      
      // Constrain to canvas bounds
      const constrained = constrainToCanvas(
        snapped.x, 
        snapped.y, 
        currentPos.width || 400, 
        currentPos.height || 400
      );
      
      updatePosition(widgetId, {
        x: constrained.x,
        y: constrained.y,
      });
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

        {/* Free-Form Canvas with Drag and Drop */}
        <DndContext 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <div 
            className="relative w-full mx-auto" 
            style={{ 
              height: `${GRID_CONFIG.CANVAS_HEIGHT}px`,
              maxWidth: `${GRID_CONFIG.CANVAS_WIDTH}px`,
            }}
          >
            <GridOverlay />
            {layout.widgetOrder.map((widgetId) => {
              const widgetDef = getWidgetById(widgetId);
              if (!widgetDef) return null;

              const position = layout.widgetPositions[widgetId];
              if (!position) return null;

              const WidgetComponent = widgetDef.component;

              return (
                <DraggableWidget
                  key={widgetId}
                  id={widgetId}
                  position={position}
                  isAnyDragging={activeDragId !== null}
                  isDraggingThis={activeDragId === widgetId}
                  onPositionChange={(newPos) => updatePosition(widgetId, newPos)}
                  onBringToFront={() => bringToFront(widgetId)}
                  onMinimize={() => toggleMinimize(widgetId)}
                  onMaximize={() => toggleMaximize(widgetId)}
                  onConfigure={() => setConfigModalWidget(widgetId)}
                  onClose={() => removeWidget(widgetId)}
                  widgetName={widgetDef.name}
                >
                  <Suspense fallback={<Skeleton className="h-full w-full" />}>
                    <div className="h-full w-full relative">
                      <WidgetComponent />
                    </div>
                  </Suspense>
                </DraggableWidget>
              );
            })}
          </div>
        </DndContext>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-muted-foreground space-y-1">
          <p>Press and hold (0.5s) any widget to drag • Magnetically snaps to grid</p>
          <p>Drag bottom-right corner to resize • All widgets fit in viewport</p>
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
