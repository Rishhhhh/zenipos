import { useDraggable } from "@dnd-kit/core";
import { useState, useRef, useEffect } from "react";
import { usePinch, useGesture } from "@use-gesture/react";
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
  const [isPinching, setIsPinching] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeGesture, setActiveGesture] = useState<'drag' | 'pinch' | 'resize' | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const initialSizeRef = useRef({ width: 0, height: 0 });
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
    if (!isDraggingThis && !isResizing && !isPinching) {
      onBringToFront();
    }
  };

  // Pinch gesture for touchscreen resize
  const bindPinch = usePinch(({ offset: [scale], first, last }) => {
    if (isMaximized || isMinimized) return;
    
    if (first) {
      setIsPinching(true);
      setActiveGesture('pinch');
      initialSizeRef.current = { 
        width: currentWidth, 
        height: currentHeight 
      };
      haptics.medium();
    }

    const newWidth = Math.max(
      widgetDef?.minSize.width || 320,
      Math.min(widgetDef?.maxSize.width || 1000, initialSizeRef.current.width * scale)
    );
    const newHeight = Math.max(
      widgetDef?.minSize.height || 320,
      Math.min(widgetDef?.maxSize.height || 800, initialSizeRef.current.height * scale)
    );

    // Snap to grid
    const snapped = snapSizeToGridRealtime(newWidth, newHeight);
    onPositionChange({ width: snapped.width, height: snapped.height });

    if (last) {
      setIsPinching(false);
      setActiveGesture(null);
      haptics.light();
    }
  }, {
    eventOptions: { passive: false },
    scaleBounds: { min: 0.5, max: 2 },
    rubberband: true,
    enabled: !isMaximized && !isMinimized
  });

  // Multi-finger swipe and double-tap gestures
  const bindGestures = useGesture(
    {
      onDrag: ({ swipe: [swipeX, swipeY], touches, last }) => {
        // Three-finger swipe down to minimize
        if (last && touches === 3 && swipeY === 1) {
          onMinimize();
          haptics.light();
        }
      },
      onDoubleClick: () => {
        // Double-tap to maximize/restore
        onMaximize();
        haptics.medium();
      }
    },
    {
      drag: { 
        swipe: { distance: 50, velocity: 0.3 },
        filterTaps: true 
      }
    }
  );

  // Unified pointer event handler (mouse + touch)
  const getClientCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Resize handle
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setActiveGesture('resize');
    onBringToFront();
    haptics.medium();
    
    const coords = getClientCoords(e);
    const rect = widgetRef.current?.getBoundingClientRect();
    startPosRef.current = { 
      x: coords.clientX, 
      y: coords.clientY,
      width: rect?.width || 0,
      height: rect?.height || 0,
    };
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const coords = 'touches' in e 
        ? { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
        : { clientX: e.clientX, clientY: e.clientY };

      const deltaX = coords.clientX - startPosRef.current.x;
      const deltaY = coords.clientY - startPosRef.current.y;

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

    const handlePointerEnd = () => {
      setIsResizing(false);
      setActiveGesture(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      haptics.light();
    };

    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerEnd);
    document.addEventListener('touchmove', handlePointerMove);
    document.addEventListener('touchend', handlePointerEnd);

    return () => {
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerEnd);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('touchend', handlePointerEnd);
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
      {...bindPinch()}
      {...bindGestures()}
      style={style}
      className={cn(
        "group rounded-lg overflow-hidden bg-card border-2 shadow-lg touch-none",
        isMaximized && "rounded-none border-0 shadow-none",
        isMinimized ? "border-primary/40 bg-card/80 cursor-grab" : "border-border cursor-grab",
        isMaximized && "cursor-default",
        "active:cursor-grabbing transition-all duration-300 ease-in-out",
        isDraggingThis && "shadow-2xl opacity-95 border-primary",
        isResizing && "shadow-xl",
        isPinching && "gesture-active",
        isMinimized && "hover:border-primary hover:bg-card"
      )}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
      {...(isMaximized || isResizing || isPinching ? {} : attributes)}
      {...(isMaximized || isResizing || isPinching ? {} : listeners)}
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
        {!isMinimized && !isMaximized && isHovered && !isDraggingThis && !isPinching && (
          <>
            <div
              className={cn(
                "widget-resize-handle absolute bottom-3 right-3 w-12 h-12 z-[100]",
                "cursor-nwse-resize touch-none touch-target",
                "bg-primary/20 hover:bg-primary/40 active:bg-primary/50 rounded-lg",
                "flex items-center justify-center",
                "transition-all duration-200",
                "shadow-md border-2 border-primary/30",
                "hover:scale-110 hover:shadow-lg active:scale-105",
                isResizing && "bg-primary/50 scale-110 shadow-lg",
                atMaxSize && "border-destructive bg-destructive/20"
              )}
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
              aria-label="Resize widget"
              data-touch-target
            >
              <Grip className={cn(
                "w-5 h-5 rotate-45 pointer-events-none",
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

        {/* Pinch indicator */}
        {isPinching && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                          bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg 
                          border border-border pointer-events-none z-50">
            <p className="text-sm font-medium">
              {Math.round(currentWidth)}×{Math.round(currentHeight)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
