import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getWidgetById } from "@/lib/widgets/widgetCatalog";
import { Grip } from "lucide-react";
import { snapSizeToGrid } from "@/lib/widgets/gridSystem";

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
  const [isHovered, setIsHovered] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const widgetDef = getWidgetById(id);

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

      const minWidth = widgetDef?.minSize.width || 250;
      const maxWidth = widgetDef?.maxSize.width || 1000;
      const minHeight = widgetDef?.minSize.height || 200;
      const maxHeight = widgetDef?.maxSize.height || 800;

      const newWidth = Math.max(minWidth, Math.min(maxWidth, startPosRef.current.width + deltaX));
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startPosRef.current.height + deltaY));

      // Live preview (no snapping during drag)
      onPositionChange({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Snap final size to grid
      const currentWidth = position.width || widgetDef?.minSize.width || 400;
      const currentHeight = position.height || widgetDef?.minSize.height || 400;
      const snapped = snapSizeToGrid(currentWidth, currentHeight);
      
      // Apply snapped size
      onPositionChange({
        width: snapped.width,
        height: snapped.height,
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onPositionChange, widgetDef]);

  const style = {
    position: 'absolute' as const,
    left: position.x,
    top: position.y,
    width: position.width || widgetDef?.minSize.width || 'auto',
    height: position.height || widgetDef?.minSize.height || 'auto',
    minWidth: widgetDef?.minSize.width,
    maxWidth: widgetDef?.maxSize.width,
    minHeight: widgetDef?.minSize.height,
    maxHeight: widgetDef?.maxSize.height,
    zIndex: isDragging ? 9999 : position.zIndex,
    transform: CSS.Transform.toString(transform),
    transition: 'none',
  };

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        (widgetRef as any).current = el;
      }}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing group",
        "transition-shadow duration-200",
        isDragging && "shadow-2xl opacity-95",
        isResizing && "shadow-xl"
      )}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...attributes}
      {...listeners}
    >
      <div className="h-full w-full relative">
        {children}
        
        {/* Resize Handle - inside widget, shown on hover */}
        {isHovered && !isDragging && (
          <div
            className={cn(
              "absolute bottom-3 right-3 w-8 h-8 z-[100]",
              "cursor-nwse-resize",
              "bg-primary/20 hover:bg-primary/40 rounded-md",
              "flex items-center justify-center",
              "transition-all duration-200",
              "shadow-md border border-primary/30",
              "hover:scale-110 hover:shadow-lg",
              isResizing && "bg-primary/50 scale-110 shadow-lg"
            )}
            onMouseDown={handleResizeStart}
            aria-label="Resize widget"
          >
            <Grip className="w-4 h-4 text-primary rotate-45" />
          </div>
        )}
      </div>
    </div>
  );
}
