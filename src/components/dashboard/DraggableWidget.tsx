import { useDraggable } from "@dnd-kit/core";
import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { getWidgetById } from "@/lib/widgets/widgetCatalog";
import { WidgetHeader } from "./WidgetHeader";
import { haptics } from "@/lib/haptics";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DraggableWidgetProps {
  id: string;
  children: React.ReactNode;
  position: { 
    x: number; 
    y: number; 
    width?: number; 
    height?: number; 
    zIndex: number;
    isMinimized?: boolean;
  };
  isAnyDragging: boolean;
  isDraggingThis: boolean;
  widgetName: string;
  onPositionChange: (position: { x?: number; y?: number; width?: number; height?: number }) => void;
  onBringToFront: () => void;
  onMinimize: () => void;
  onConfigure: () => void;
  onClose: () => void;
}

// Per-widget error boundary to prevent one widget from crashing the entire dashboard
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; widgetId: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`❌ Widget ${this.props.widgetId} crashed:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-4 text-center">
          <div>
            <AlertCircle className="h-8 w-8 text-danger mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Widget failed to load
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function DraggableWidget({
  id, 
  children, 
  position, 
  isAnyDragging,
  isDraggingThis,
  widgetName,
  onPositionChange,
  onBringToFront,
  onMinimize,
  onConfigure,
  onClose,
}: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({ id });

  const navigate = useNavigate();
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetDef = getWidgetById(id);

  const isMinimized = position.isMinimized || false;

  const handleNavigateToModule = () => {
    if (widgetDef?.moduleRoute) {
      navigate(widgetDef.moduleRoute);
      haptics.medium();
    }
  };

  // Bring to front when clicked
  const handleMouseDown = () => {
    if (!isDraggingThis) {
      onBringToFront();
    }
  };

  const currentWidth = position.width || 400;
  const currentHeight = position.height || 400;

  // Calculate display dimensions based on state
  const getDisplayDimensions = () => {
    if (isMinimized) {
      return { width: 300, height: 56 };
    }
    
    // Normal state: use actual stored dimensions
    return {
      width: currentWidth,
      height: currentHeight,
    };
  };

  const dims = getDisplayDimensions();

  // Normal/minimized mode
  const style = {
    position: 'absolute' as const,
    left: position.x,
    top: position.y,
    width: dims.width,
    height: dims.height,
    zIndex: isDraggingThis ? 40 : Math.min(position.zIndex, 39),
    transform: isDraggingThis && transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: isDraggingThis ? 'none' : 'width 0.3s ease, height 0.3s ease, box-shadow 0.2s ease, border-color 0.2s ease',
    pointerEvents: (isAnyDragging && !isDraggingThis) ? 'none' as const : 'auto' as const,
  };

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        (widgetRef as any).current = el;
      }}
      style={style}
      className={cn(
        "group rounded-xl backdrop-blur-md transition-all duration-300",
        "bg-card/95 border border-border/60",
        // Enhanced shadows for depth
        !isDraggingThis && "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)]",
        !isDraggingThis && "hover:shadow-[0_4px_8px_rgba(0,0,0,0.08),0_8px_20px_rgba(0,0,0,0.06)]",
        isDraggingThis && "cursor-grabbing shadow-[0_8px_16px_rgba(0,0,0,0.12),0_16px_32px_rgba(0,0,0,0.1)] ring-2 ring-primary/30 scale-[1.02]",
        !isDraggingThis && "cursor-grab hover:border-primary/50",
        isMinimized && "overflow-hidden border-primary/40 bg-card/80 hover:border-primary hover:bg-card"
      )}
      onMouseDown={handleMouseDown}
      {...attributes}
      {...listeners}
    >
      <div className="h-full w-full relative">
        {/* Widget Header */}
        <WidgetHeader
          widgetId={id}
          widgetName={widgetName}
          isMinimized={isMinimized}
          onMinimize={onMinimize}
          onNavigateToModule={handleNavigateToModule}
          onClose={onClose}
          onConfigure={onConfigure}
        />

        {/* Minimized State Indicator */}
        {isMinimized && (
          <div className="absolute left-0 right-0 bottom-0 h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />
        )}

        {/* Widget Content */}
        {!isMinimized && (
          <div className="h-full w-full pt-2 overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 overflow-auto">
              <WidgetErrorBoundary widgetId={id}>
                {children}
              </WidgetErrorBoundary>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
