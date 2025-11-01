import { useState, Suspense, useEffect } from "react";
import { DndContext, DragEndEvent, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { DraggableWidget } from "@/components/dashboard/DraggableWidget";
import { getWidgetById } from "@/lib/widgets/widgetCatalog";
import { Skeleton } from "@/components/ui/skeleton";
import { haptics } from "@/lib/haptics";
import { softSnapPosition, constrainToCanvas, GRID_CONFIG } from "@/lib/widgets/gridSystem";
import { GridOverlay } from "@/components/dashboard/GridOverlay";
import { useWidgetLayout } from "@/lib/widgets/useWidgetLayout";

interface DraggableDashboardProps {
  onConfigure: (widgetId: string) => void;
}

export default function DraggableDashboard({ onConfigure }: DraggableDashboardProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [viewportKey, setViewportKey] = useState(0);
  
  const { layout, updatePosition, bringToFront, removeWidget, toggleMinimize, toggleMaximize } = useWidgetLayout();
  
  const maximizedWidget = layout.widgetOrder.find(id => 
    layout.widgetPositions[id]?.isMaximized
  );

  useEffect(() => {
    const handleResize = () => {
      setViewportKey(prev => prev + 1);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { delay: 350, tolerance: 5 }
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 350, tolerance: 5 }
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
      
      const snapped = softSnapPosition(rawX, rawY);
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
    <DndContext
      key={viewportKey}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div 
        className="relative w-full mx-auto bg-card/20 rounded-lg" 
        style={{ 
          height: `${GRID_CONFIG.CANVAS_HEIGHT}px`,
          minHeight: '600px',
          overflow: 'visible',
        }}
      >
        {maximizedWidget && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[44] animate-in fade-in duration-300"
            onClick={() => toggleMaximize(maximizedWidget)}
            aria-label="Click to restore widget"
          />
        )}
        
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
              onConfigure={() => onConfigure(widgetId)}
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
  );
}
