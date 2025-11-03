import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { findEmptyGridSpace } from "./autoPlacement";
import { getLayoutForRole } from "./roleLayouts";
import { GRID_CONFIG, validateDimensions } from "./gridSystem";

export interface WidgetPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex: number;
  isMinimized?: boolean;
  _originalWidth?: number;
  _originalHeight?: number;
}

export interface WidgetLayout {
  widgetOrder: string[];
  widgetPositions: Record<string, WidgetPosition>;
}

export function useWidgetLayout() {
  const { employee } = useAuth();
  const storageKey = `dashboard-layout-${employee?.id || 'default'}`;
  
  // Get role-based default layout
  const getDefaultLayout = useCallback(() => {
    return getLayoutForRole(employee?.role || 'cashier');
  }, [employee?.role]);
  
  const [layout, setLayout] = useState<WidgetLayout>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getDefaultLayout();
      }
    }
    return getDefaultLayout();
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
    // Validate dimensions before updating
    if (position.width !== undefined && position.height !== undefined) {
      if (!validateDimensions(position.width, position.height)) {
        console.error('Invalid widget dimensions:', position);
        return; // Don't update with invalid dimensions
      }
    }
    
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
            width: defaultSize.cols * GRID_CONFIG.CELL_SIZE,
            height: defaultSize.rows * GRID_CONFIG.CELL_SIZE,
            zIndex: maxZ + 1,
            isMinimized: false,
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
    const defaultLayout = getDefaultLayout();
    setLayout(defaultLayout);
    localStorage.setItem(storageKey, JSON.stringify(defaultLayout));
  }, [getDefaultLayout, storageKey]);

  const toggleMinimize = useCallback((widgetId: string) => {
    setLayout(prev => {
      const currentPos = prev.widgetPositions[widgetId];
      const isCurrentlyMinimized = currentPos.isMinimized;

      if (isCurrentlyMinimized) {
        // UN-MINIMIZING: Restore to normal
        return {
          ...prev,
          widgetPositions: {
            ...prev.widgetPositions,
            [widgetId]: {
              ...currentPos,
              isMinimized: false,
              // Restore original dimensions
              width: currentPos._originalWidth || currentPos.width,
              height: currentPos._originalHeight || currentPos.height,
              // Clear stored originals now that we're back to normal
              _originalWidth: undefined,
              _originalHeight: undefined,
            },
          },
        };
      } else {
        // MINIMIZING: Store originals
        return {
          ...prev,
          widgetPositions: {
            ...prev.widgetPositions,
            [widgetId]: {
              ...currentPos,
              isMinimized: true,
              // Store originals
              _originalWidth: currentPos.width,
              _originalHeight: currentPos.height,
            },
          },
        };
      }
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
  };
}
