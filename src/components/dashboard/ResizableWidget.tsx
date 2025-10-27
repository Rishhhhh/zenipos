import { useState, useRef, useEffect } from "react";
import { Maximize2 } from "lucide-react";
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
        isResizing && "z-50"
      )}
      style={{
        gridColumn: `span ${cols}`,
        gridRow: `span ${rows}`,
      }}
    >
      {children}
      
      {/* Resize Handle */}
      <button
        className={cn(
          "absolute bottom-2 right-2 p-1.5 rounded-md",
          "bg-background/80 backdrop-blur-sm border border-border",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-accent hover:border-primary",
          "cursor-nwse-resize z-10",
          isResizing && "opacity-100 bg-accent border-primary"
        )}
        onMouseDown={handleResizeStart}
        aria-label="Resize widget"
      >
        <Maximize2 className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  );
}
