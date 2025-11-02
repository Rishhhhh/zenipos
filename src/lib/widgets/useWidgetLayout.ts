import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { findEmptyGridSpace } from "./autoPlacement";
import { getLayoutForRole } from "./roleLayouts";

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
  _wasMinimized?: boolean;
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
    const defaultLayout = getDefaultLayout();
    setLayout(defaultLayout);
    localStorage.setItem(storageKey, JSON.stringify(defaultLayout));
  }, [getDefaultLayout, storageKey]);

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
      const isCurrentlyMaximized = current.isMaximized;
      const isCurrentlyMinimized = current.isMinimized;
      
      return {
        ...prev,
        widgetPositions: {
          ...prev.widgetPositions,
          [widgetId]: {
            ...current,
            isMaximized: !isCurrentlyMaximized,
            isMinimized: false,
            ...(!isCurrentlyMaximized ? {
              // Store originals when maximizing
              _originalX: current.x,
              _originalY: current.y,
              // If currently minimized, use the stored original width, not 300px
              _originalWidth: isCurrentlyMinimized && current._originalWidth 
                ? current._originalWidth 
                : current.width,
              _originalHeight: current.height,
              // Remember if it was minimized before maximizing
              _wasMinimized: isCurrentlyMinimized,
              // Don't set x/y/width/height - DraggableWidget handles via CSS
            } : {
              // Restore originals when un-maximizing
              x: current._originalX || current.x,
              y: current._originalY || current.y,
              width: current._originalWidth || current.width,
              height: current._originalHeight || current.height,
              // If it was minimized before maximizing, restore to minimized state
              isMinimized: current._wasMinimized || false,
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
