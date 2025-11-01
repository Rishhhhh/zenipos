import { useState } from "react";
import { useDrag } from "@use-gesture/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { haptics } from "@/lib/haptics";

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface CategoryListProps {
  categories: Category[] | undefined;
  isLoading: boolean;
  selectedCategoryId?: string;
  onSelectCategory: (categoryId: string | undefined) => void;
}

export function CategoryList({ 
  categories, 
  isLoading, 
  selectedCategoryId, 
  onSelectCategory 
}: CategoryListProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(false);
  
  const currentIndex = categories?.findIndex(c => c.id === selectedCategoryId) ?? -1;
  const totalCategories = categories?.length || 0;
  
  // Swipe gesture for category navigation
  const bindSwipe = useDrag(({ movement: [mx], last, swipe: [swipeX], velocity: [vx] }) => {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (!isTouchDevice) return; // Only enable on touch devices
    
    if (!last) {
      setSwipeOffset(mx);
      setShowSwipeIndicator(Math.abs(mx) > 30);
    } else {
      // Determine if swipe was strong enough
      const shouldSwitch = Math.abs(swipeX) === 1 || Math.abs(vx) > 0.5;
      
      if (shouldSwitch) {
        // Swipe left: next category
        if (swipeX === -1 && currentIndex < totalCategories - 1) {
          onSelectCategory(categories![currentIndex + 1].id);
          haptics.light();
        }
        // Swipe right: previous category  
        else if (swipeX === 1 && currentIndex > 0) {
          onSelectCategory(categories![currentIndex - 1].id);
          haptics.light();
        }
      }
      
      setSwipeOffset(0);
      setShowSwipeIndicator(false);
    }
  }, {
    axis: 'x',
    swipe: { distance: 50, velocity: 0.3 },
    filterTaps: true
  });

  return (
    <div className="h-full bg-secondary/30 p-4 flex flex-col overflow-hidden relative">
      <h2 className="text-lg font-semibold mb-4 text-foreground flex-shrink-0">
        Categories
        {totalCategories > 0 && (
          <span className="text-xs text-muted-foreground ml-2">
            {currentIndex + 1}/{totalCategories}
          </span>
        )}
      </h2>
      
      {/* Swipe indicators */}
      {showSwipeIndicator && (
        <>
          {swipeOffset > 30 && currentIndex > 0 && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 animate-in slide-in-from-left">
              <ChevronLeft className="h-8 w-8 text-primary drop-shadow-lg" />
            </div>
          )}
          {swipeOffset < -30 && currentIndex < totalCategories - 1 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 animate-in slide-in-from-right">
              <ChevronRight className="h-8 w-8 text-primary drop-shadow-lg" />
            </div>
          )}
        </>
      )}
      
      <div 
        {...bindSwipe()} 
        className="flex-1 overflow-y-auto space-y-2 touch-pan-y"
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none'
        }}
      >
        <Button
          variant={!selectedCategoryId ? "default" : "ghost"}
          className="w-full justify-start mb-2 touch-target"
          onClick={() => onSelectCategory(undefined)}
        >
          All Items
        </Button>
        
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {categories?.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategoryId === cat.id ? "default" : "ghost"}
                className="w-full justify-start touch-target"
                onClick={() => onSelectCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
