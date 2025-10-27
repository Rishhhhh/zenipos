import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DraggableWidgetProps {
  id: string;
  children: React.ReactNode;
  position: { x: number; y: number; width?: number; height?: number; zIndex: number };
  onPositionChange: (position: { x?: number; y?: number; width?: number; height?: number }) => void;
  onBringToFront: () => void;
}

export function DraggableWidget({ 
  id, 
  children, 
  position, 
  onPositionChange,
  onBringToFront 
}: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id });

  const [isResizing, setIsResizing] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Bring to front when clicked
  const handleMouseDown = () => {
    if (!isDragging && !isResizing) {
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

      const newWidth = Math.max(250, startPosRef.current.width + deltaX);
      const newHeight = Math.max(200, startPosRef.current.height + deltaY);

      onPositionChange({ width: newWidth, height: newHeight });
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
  }, [isResizing, onPositionChange]);

  const style = {
    position: 'absolute' as const,
    left: position.x,
    top: position.y,
    width: position.width || 'auto',
    height: position.height || 'auto',
    zIndex: isDragging ? 9999 : position.zIndex,
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : 'transform 0.2s ease',
  };

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        (widgetRef as any).current = el;
      }}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        "transition-shadow duration-200",
        isDragging && "shadow-2xl scale-[1.02] opacity-90",
        isResizing && "shadow-xl"
      )}
      onMouseDown={handleMouseDown}
      {...attributes}
      {...listeners}
    >
      {children}
      
      {/* Resize Handle - 24px × 24px bottom-right */}
      <div
        className={cn(
          "absolute bottom-0 right-0 w-6 h-6",
          "cursor-nwse-resize",
          "hover:bg-primary/20 transition-colors rounded-tl-lg",
          isResizing && "bg-primary/30"
        )}
        onMouseDown={handleResizeStart}
        aria-label="Resize widget"
      />
    </div>
  );
}
