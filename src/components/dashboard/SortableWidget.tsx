import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface SortableWidgetProps {
  id: string;
  children: ReactNode;
  index: number;
}

export function SortableWidget({ id, children, index }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [isHolding, setIsHolding] = useState(false);

  // Trigger haptic feedback when drag starts
  useEffect(() => {
    if (isDragging && !isHolding) {
      haptics.medium();
      setIsHolding(true);
    } else if (!isDragging && isHolding) {
      setIsHolding(false);
    }
  }, [isDragging, isHolding]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative animate-fade-in will-change-transform group",
        isDragging ? "cursor-grabbing scale-[1.02] shadow-2xl z-50" : "cursor-grab",
        isHolding && "ring-2 ring-primary/50"
      )}
      {...attributes}
      {...listeners}
    >
      {/* Widget Content */}
      {children}
    </div>
  );
}
