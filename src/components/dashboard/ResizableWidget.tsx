import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ResizableWidgetProps {
  id: string;
  children: React.ReactNode;
  cols: number;
  rows: number;
  onResize: (cols: number, rows: number) => void;
}

export function ResizableWidget({ 
  id, 
  children, 
  cols, 
  rows, 
  onResize 
}: ResizableWidgetProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [isColliding, setIsColliding] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, cols, rows });

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!widgetRef.current) return;

      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;

      // Calculate new cols/rows based on movement (roughly 250px per col, 300px per row)
      const colsDelta = Math.round(deltaX / 250);
      const rowsDelta = Math.round(deltaY / 300);

      const newCols = Math.max(1, Math.min(4, startPosRef.current.cols + colsDelta));
      const newRows = Math.max(1, Math.min(2, startPosRef.current.rows + rowsDelta));

      // Only update if changed
      if (newCols !== cols || newRows !== rows) {
        onResize(newCols, newRows);
        
        // Show collision animation briefly
        setIsColliding(true);
        setTimeout(() => setIsColliding(false), 600);
      }
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
  }, [isResizing, cols, rows, onResize]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    startPosRef.current = { x: e.clientX, y: e.clientY, cols, rows };
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      ref={widgetRef}
      className={cn(
        "relative group",
        `col-span-${cols} row-span-${rows}`,
        isResizing && "z-50",
        isColliding && "animate-pulse ring-2 ring-amber-500"
      )}
      style={{
        gridColumn: `span ${cols}`,
        gridRow: `span ${rows}`,
      }}
    >
      {children}
      
      {/* Invisible Resize Hitbox - 24px x 24px at bottom-right */}
      <div
        className={cn(
          "absolute bottom-0 right-0 w-6 h-6",
          "cursor-nwse-resize",
          "hover:bg-primary/10 transition-colors rounded-tl-lg",
          isResizing && "bg-primary/20"
        )}
        onMouseDown={handleResizeStart}
        aria-label="Resize widget"
      />
    </div>
  );
}
