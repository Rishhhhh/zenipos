import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { findEmptyGridSpace } from "./autoPlacement";

export interface WidgetPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex: number;
  isMinimized?: boolean;
  isMaximized?: boolean;
  _originalWidth?: number;
  _originalHeight?: number;
  _originalX?: number;
  _originalY?: number;
}

export interface WidgetLayout {
  widgetOrder: string[];
  widgetPositions: Record<string, WidgetPosition>;
}

const DEFAULT_LAYOUT: WidgetLayout = {
  widgetOrder: ["quick-pos", "active-orders", "sales"],
  widgetPositions: {
    // Quick POS: Top-left, 10x10 cells (600x600px) - grid aligned
    "quick-pos": { x: 0, y: 0, width: 600, height: 600, zIndex: 1, isMinimized: false, isMaximized: false },
    
    // Active Orders: Top-middle-right, 6x5 cells (360x300px) - grid aligned
    "active-orders": { x: 660, y: 0, width: 360, height: 300, zIndex: 2, isMinimized: false, isMaximized: false },
    
    // Sales: Below active orders, 6x5 cells (360x300px) - grid aligned  
    "sales": { x: 660, y: 360, width: 360, height: 300, zIndex: 3, isMinimized: false, isMaximized: false },
  },
};

export function useWidgetLayout() {
  const { employee } = useAuth();
  const storageKey = `dashboard-layout-${employee?.id || 'default'}`;
  
  const [layout, setLayout] = useState<WidgetLayout>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Migrate old format (widgetSizes) to new format (widgetPositions)
        if (parsed.widgetSizes && !parsed.widgetPositions) {
          const migratedPositions: Record<string, WidgetPosition> = {};
          let currentX = 20;
          let currentY = 20;
          
          parsed.widgetOrder?.forEach((widgetId: string, index: number) => {
            const size = parsed.widgetSizes[widgetId] || { cols: 1, rows: 1 };
            migratedPositions[widgetId] = {
              x: currentX,
              y: currentY,
              width: size.cols * 250,
              height: size.rows * 300,
              zIndex: index + 1,
            };
            
            // Stack widgets vertically with some spacing
            currentY += (size.rows * 300) + 20;
          });
          
          return {
            widgetOrder: parsed.widgetOrder || [],
            widgetPositions: migratedPositions,
          };
        }
        
        return parsed;
      } catch {
        return DEFAULT_LAYOUT;
      }
    }
    return DEFAULT_LAYOUT;
  });

  // Debounced save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(layout));
    }, 500);

    return () => clearTimeout(timer);
  }, [layout, storageKey]);

  const updateOrder = useCallback((newOrder: string[]) => {
    setLayout(prev => ({ ...prev, widgetOrder: newOrder }));
  }, []);

  const updatePosition = useCallback((widgetId: string, position: Partial<WidgetPosition>) => {
    setLayout(prev => ({
      ...prev,
      widgetPositions: {
        ...prev.widgetPositions,
        [widgetId]: {
          ...prev.widgetPositions[widgetId],
          ...position,
        },
      },
    }));
  }, []);

  const bringToFront = useCallback((widgetId: string) => {
    setLayout(prev => {
      const maxZ = Math.max(...Object.values(prev.widgetPositions).map(p => p.zIndex));
      return {
        ...prev,
        widgetPositions: {
          ...prev.widgetPositions,
          [widgetId]: {
            ...prev.widgetPositions[widgetId],
            zIndex: maxZ + 1,
          },
        },
      };
    });
  }, []);

  const addWidget = useCallback((widgetId: string, defaultSize: { cols: number; rows: number }) => {
    setLayout(prev => {
      const maxZ = Math.max(...Object.values(prev.widgetPositions).map(p => p.zIndex), 0);
      
      // Use auto-placement to find empty spot
      const position = findEmptyGridSpace(prev.widgetPositions, defaultSize);
      
      return {
        widgetOrder: [...prev.widgetOrder, widgetId],
        widgetPositions: {
          ...prev.widgetPositions,
          [widgetId]: {
            x: position.x,
            y: position.y,
            width: defaultSize.cols * 60,
            height: defaultSize.rows * 60,
            zIndex: maxZ + 1,
            isMinimized: false,
            isMaximized: false,
          },
        },
      };
    });
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setLayout(prev => {
      const newPositions = { ...prev.widgetPositions };
      delete newPositions[widgetId];
      
      return {
        widgetOrder: prev.widgetOrder.filter(id => id !== widgetId),
        widgetPositions: newPositions,
      };
    });
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
  }, []);

  const toggleMinimize = useCallback((widgetId: string) => {
    setLayout(prev => {
      const currentPos = prev.widgetPositions[widgetId];
      const isCurrentlyMinimized = currentPos.isMinimized;

      return {
        ...prev,
        widgetPositions: {
          ...prev.widgetPositions,
          [widgetId]: {
            ...currentPos,
            isMinimized: !isCurrentlyMinimized,
            isMaximized: false,
            // Store original width when minimizing, restore when un-minimizing
            _originalWidth: !isCurrentlyMinimized ? currentPos.width : undefined,
            width: !isCurrentlyMinimized ? 300 : (currentPos._originalWidth || currentPos.width),
          },
        },
      };
    });
  }, []);

  const toggleMaximize = useCallback((widgetId: string) => {
    setLayout(prev => {
      const current = prev.widgetPositions[widgetId];
      const isMaximized = !current.isMaximized;
      
      return {
        ...prev,
        widgetPositions: {
          ...prev.widgetPositions,
          [widgetId]: {
            ...current,
            isMaximized,
            isMinimized: false,
            // Store original size when maximizing
            ...(isMaximized ? {
              _originalX: current.x,
              _originalY: current.y,
              _originalWidth: current.width,
              _originalHeight: current.height,
              x: 0,
              y: 0,
              width: 1280,
              height: 800,
            } : {
              x: (current as any)._originalX || current.x,
              y: (current as any)._originalY || current.y,
              width: (current as any)._originalWidth || current.width,
              height: (current as any)._originalHeight || current.height,
            }),
          },
        },
      };
    });
  }, []);

  return {
    layout,
    updateOrder,
    updatePosition,
    bringToFront,
    addWidget,
    removeWidget,
    resetLayout,
    toggleMinimize,
    toggleMaximize,
  };
}
