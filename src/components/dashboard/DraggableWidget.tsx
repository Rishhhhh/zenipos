import { useDraggable } from "@dnd-kit/core";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getWidgetById } from "@/lib/widgets/widgetCatalog";
import { Grip } from "lucide-react";
import { snapSizeToGridRealtime, isAtMaxSize } from "@/lib/widgets/gridSystem";
import { WidgetHeader } from "./WidgetHeader";
import { ResizeTooltip } from "./ResizeTooltip";
import { haptics } from "@/lib/haptics";

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
    isMaximized?: boolean;
  };
  isAnyDragging: boolean;
  isDraggingThis: boolean;
  widgetName: string;
  onPositionChange: (position: { x?: number; y?: number; width?: number; height?: number }) => void;
  onBringToFront: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onConfigure: () => void;
  onClose: () => void;
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
  onMaximize,
  onConfigure,
  onClose,
}: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({ id });

  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const widgetDef = getWidgetById(id);

  const isMinimized = position.isMinimized || false;
  const isMaximized = position.isMaximized || false;

  // Escape key handler for maximized widgets
  useEffect(() => {
    if (!isMaximized) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onMaximize(); // Toggle maximize off
        haptics.light();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMaximized, onMaximize]);

  // Bring to front when clicked
  const handleMouseDown = () => {
    if (!isDraggingThis && !isResizing) {
      onBringToFront();
    }
  };

  // Resize handle
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    onBringToFront();
    
    const rect = widgetRef.current?.getBoundingClientRect();
    startPosRef.current = { 
      x: e.clientX, 
      y: e.clientY,
      width: rect?.width || 0,
      height: rect?.height || 0,
    };
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;

      const minWidth = widgetDef?.minSize.width || 320;
      const maxWidth = widgetDef?.maxSize.width || 1000;
      const minHeight = widgetDef?.minSize.height || 320;
      const maxHeight = widgetDef?.maxSize.height || 800;

      const rawWidth = Math.max(minWidth, Math.min(maxWidth, startPosRef.current.width + deltaX));
      const rawHeight = Math.max(minHeight, Math.min(maxHeight, startPosRef.current.height + deltaY));

      // Snap to grid in real-time
      const snapped = snapSizeToGridRealtime(rawWidth, rawHeight);
      
      onPositionChange({ width: snapped.width, height: snapped.height });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onPositionChange, widgetDef]);

  const currentWidth = position.width || widgetDef?.minSize.width || 400;
  const currentHeight = position.height || widgetDef?.minSize.height || 400;

  const atMaxSize = widgetDef && isAtMaxSize(
    currentWidth,
    currentHeight,
    widgetDef.maxSize.width,
    widgetDef.maxSize.height
  );

  // Only apply transform if this widget is being dragged
  const style = isMaximized ? {
    // Full-screen overlay mode
    position: 'fixed' as const,
    inset: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 45,
    transition: 'none',
    pointerEvents: 'auto' as const,
  } : {
    // Normal/minimized mode
    position: 'absolute' as const,
    left: position.x,
    top: position.y,
    width: isMinimized ? 300 : currentWidth,
    height: isMinimized ? 56 : currentHeight,
    minWidth: widgetDef?.minSize.width,
    maxWidth: widgetDef?.maxSize.width,
    minHeight: isMinimized ? 56 : widgetDef?.minSize.height,
    maxHeight: widgetDef?.maxSize.height,
    zIndex: isDraggingThis ? 40 : Math.min(position.zIndex, 39),
    transform: isDraggingThis && transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: isDraggingThis || isResizing ? 'none' : 'width 0.3s ease, height 0.3s ease, box-shadow 0.2s ease, border-color 0.2s ease',
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
        "group rounded-lg overflow-hidden bg-card border-2 shadow-lg",
        isMaximized && "rounded-none border-0 shadow-none",
        isMinimized ? "border-primary/40 bg-card/80 cursor-grab" : "border-border cursor-grab",
        isMaximized && "cursor-default",
        "active:cursor-grabbing transition-all duration-300 ease-in-out",
        isDraggingThis && "shadow-2xl opacity-95 border-primary",
        isResizing && "shadow-xl",
        isMinimized && "hover:border-primary hover:bg-card"
      )}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...(isMaximized ? {} : attributes)}
      {...(isMaximized ? {} : listeners)}
    >
      <div className="h-full w-full relative">
        {/* Widget Header */}
        <WidgetHeader
          widgetId={id}
          widgetName={widgetName}
          isMinimized={isMinimized}
          isMaximized={isMaximized}
          onMinimize={onMinimize}
          onMaximize={onMaximize}
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
              {children}
            </div>
          </div>
        )}
        
        {/* Resize Handle */}
        {!isMinimized && !isMaximized && isHovered && !isDraggingThis && (
          <>
            <div
              className={cn(
                "absolute bottom-3 right-3 w-8 h-8 z-[100]",
                "cursor-nwse-resize",
                "bg-primary/20 hover:bg-primary/40 rounded-md",
                "flex items-center justify-center",
                "transition-all duration-200",
                "shadow-md border border-primary/30",
                "hover:scale-110 hover:shadow-lg",
                isResizing && "bg-primary/50 scale-110 shadow-lg",
                atMaxSize && "border-destructive bg-destructive/20"
              )}
              onMouseDown={handleResizeStart}
              aria-label="Resize widget"
            >
              <Grip className={cn(
                "w-4 h-4 rotate-45",
                atMaxSize ? "text-destructive" : "text-primary"
              )} />
            </div>
            <ResizeTooltip 
              width={currentWidth} 
              height={currentHeight} 
              isVisible={isResizing} 
            />
          </>
        )}
      </div>
    </div>
  );
}
