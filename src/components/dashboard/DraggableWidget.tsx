import { useDraggable } from "@dnd-kit/core";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getWidgetById } from "@/lib/widgets/widgetCatalog";
import { WidgetHeader } from "./WidgetHeader";
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

  const widgetRef = useRef<HTMLDivElement>(null);
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
    if (!isDraggingThis) {
      onBringToFront();
    }
  };

  const currentWidth = position.width || 400;
  const currentHeight = position.height || 400;

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
        "group rounded-lg overflow-hidden bg-card border-2 shadow-lg touch-none",
        isMaximized && "rounded-none border-0 shadow-none",
        isMinimized ? "border-primary/40 bg-card/80 cursor-grab" : "border-border cursor-grab",
        isMaximized && "cursor-default",
        "active:cursor-grabbing transition-all duration-300 ease-in-out",
        isDraggingThis && "shadow-2xl opacity-95 border-primary",
        isMinimized && "hover:border-primary hover:bg-card"
      )}
      onMouseDown={handleMouseDown}
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
      </div>
    </div>
  );
}
