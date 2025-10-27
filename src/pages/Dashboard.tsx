import { useState, useEffect } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { useAuth } from "@/contexts/AuthContext";
import { SortableWidget } from "@/components/dashboard/SortableWidget";
import { QuickPOSWidget } from "@/components/dashboard/QuickPOSWidget";
import { ActiveOrdersWidget } from "@/components/dashboard/ActiveOrdersWidget";
import { NumberPadWidget } from "@/components/dashboard/NumberPadWidget";
import { SalesWidget } from "@/components/dashboard/SalesWidget";

interface Widget {
  id: string;
  component: React.ComponentType;
  roles: ("cashier" | "manager" | "admin")[];
}

const AVAILABLE_WIDGETS: Widget[] = [
  {
    id: "quick-pos",
    component: QuickPOSWidget,
    roles: ["cashier", "manager", "admin"],
  },
  {
    id: "active-orders",
    component: ActiveOrdersWidget,
    roles: ["cashier", "manager", "admin"],
  },
  {
    id: "number-pad",
    component: NumberPadWidget,
    roles: ["cashier", "manager", "admin"],
  },
  {
    id: "sales",
    component: SalesWidget,
    roles: ["manager", "admin"],
  },
];

const LAYOUT_STORAGE_KEY = "dashboard-widget-order";

export default function Dashboard() {
  const { employee } = useAuth();
  const userRole = employee?.role || "cashier";

  // Filter widgets based on role
  const visibleWidgets = AVAILABLE_WIDGETS.filter((widget) =>
    widget.roles.includes(userRole)
  );

  // Load saved order from localStorage or use default
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out widgets user doesn't have access to
        return parsed.filter((id: string) =>
          visibleWidgets.some((w) => w.id === id)
        );
      } catch {
        return visibleWidgets.map((w) => w.id);
      }
    }
    return visibleWidgets.map((w) => w.id);
  });

  // Update order when role changes
  useEffect(() => {
    const currentWidgetIds = visibleWidgets.map((w) => w.id);
    const filteredOrder = widgetOrder.filter((id) =>
      currentWidgetIds.includes(id)
    );

    // Add any new widgets that aren't in the saved order
    const missingWidgets = currentWidgetIds.filter(
      (id) => !filteredOrder.includes(id)
    );
    if (missingWidgets.length > 0) {
      setWidgetOrder([...filteredOrder, ...missingWidgets]);
    }
  }, [userRole]);

  // Save order to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(widgetOrder));
  }, [widgetOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/5 p-4 md:p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {employee?.name || "User"} • {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </p>
        </div>

        {/* Widgets Grid with Drag and Drop */}
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {widgetOrder.map((widgetId, index) => {
                const widget = visibleWidgets.find((w) => w.id === widgetId);
                if (!widget) return null;

                const WidgetComponent = widget.component;

                return (
                  <SortableWidget
                    key={widget.id}
                    id={widget.id}
                    index={index}
                  >
                    <WidgetComponent />
                  </SortableWidget>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Drag widgets to rearrange • Layout saves automatically</p>
        </div>
      </div>
    </div>
  );
}
