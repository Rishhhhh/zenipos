import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface WidgetPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex: number;
}

export interface WidgetLayout {
  widgetOrder: string[];
  widgetPositions: Record<string, WidgetPosition>;
}

const DEFAULT_LAYOUT: WidgetLayout = {
  widgetOrder: ["quick-pos", "active-orders", "sales"],
  widgetPositions: {
    "quick-pos": { x: 20, y: 20, width: 500, height: 600, zIndex: 1 },
    "active-orders": { x: 540, y: 20, width: 400, height: 300, zIndex: 2 },
    "sales": { x: 960, y: 20, width: 500, height: 300, zIndex: 3 },
  },
};

export function useWidgetLayout() {
  const { employee } = useAuth();
  const storageKey = `dashboard-layout-${employee?.id || 'default'}`;
  
  const [layout, setLayout] = useState<WidgetLayout>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
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
      return {
        widgetOrder: [...prev.widgetOrder, widgetId],
        widgetPositions: {
          ...prev.widgetPositions,
          [widgetId]: {
            x: 20,
            y: 20,
            width: defaultSize.cols * 250,
            height: defaultSize.rows * 300,
            zIndex: maxZ + 1,
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

  return {
    layout,
    updateOrder,
    updatePosition,
    bringToFront,
    addWidget,
    removeWidget,
    resetLayout,
  };
}
