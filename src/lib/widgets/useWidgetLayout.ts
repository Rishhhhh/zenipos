import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface WidgetSize {
  cols: number; // 1-4
  rows: number; // 1-2
}

export interface WidgetLayout {
  widgetOrder: string[];
  widgetSizes: Record<string, WidgetSize>;
}

const DEFAULT_LAYOUT: WidgetLayout = {
  widgetOrder: ["quick-pos", "active-orders", "sales"],
  widgetSizes: {
    "quick-pos": { cols: 2, rows: 2 },
    "active-orders": { cols: 1, rows: 1 },
    "sales": { cols: 2, rows: 1 },
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

  const updateSize = useCallback((widgetId: string, size: WidgetSize) => {
    setLayout(prev => ({
      ...prev,
      widgetSizes: {
        ...prev.widgetSizes,
        [widgetId]: size,
      },
    }));
  }, []);

  const addWidget = useCallback((widgetId: string, defaultSize: WidgetSize) => {
    setLayout(prev => ({
      widgetOrder: [...prev.widgetOrder, widgetId],
      widgetSizes: {
        ...prev.widgetSizes,
        [widgetId]: defaultSize,
      },
    }));
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setLayout(prev => {
      const newSizes = { ...prev.widgetSizes };
      delete newSizes[widgetId];
      
      return {
        widgetOrder: prev.widgetOrder.filter(id => id !== widgetId),
        widgetSizes: newSizes,
      };
    });
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
  }, []);

  return {
    layout,
    updateOrder,
    updateSize,
    addWidget,
    removeWidget,
    resetLayout,
  };
}
