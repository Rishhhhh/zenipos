import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface WidgetConfig {
  displayType: 'chart' | 'table' | 'cards' | 'gauge';
  colorScheme: string; // ThemeId or 'auto'
  refreshInterval: 5 | 30 | 60 | 300;
  compactMode: boolean;
  dataFilters: {
    dateRange?: 'today' | 'week' | 'month';
    branchIds?: string[];
  };
}

/**
 * Smart defaults: Charts for finance data, Tables for text data
 */
export function getDefaultDisplayType(widgetType: string): 'chart' | 'table' {
  const financeWidgets = ['sales', 'revenue-chart', 'loyalty-stats'];
  const textWidgets = ['top-items', 'low-stock', 'active-shifts'];
  
  if (financeWidgets.includes(widgetType)) return 'chart';
  if (textWidgets.includes(widgetType)) return 'table';
  return 'chart'; // Default fallback
}

/**
 * Get default config for a widget type
 */
export function getDefaultConfig(widgetType: string): WidgetConfig {
  return {
    displayType: getDefaultDisplayType(widgetType),
    colorScheme: 'auto', // Auto-match current theme
    refreshInterval: 30,
    compactMode: false,
    dataFilters: {},
  };
}

/**
 * Hook to manage per-user widget configuration
 */
export function useWidgetConfig(widgetId: string) {
  const { employee } = useAuth();
  const storageKey = `widget_config_${employee?.id || 'default'}_${widgetId}`;
  
  const [config, setConfig] = useState<WidgetConfig>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getDefaultConfig(widgetId);
      }
    }
    return getDefaultConfig(widgetId);
  });
  
  const saveConfig = useCallback((newConfig: WidgetConfig) => {
    setConfig(newConfig);
    localStorage.setItem(storageKey, JSON.stringify(newConfig));
  }, [storageKey]);

  const resetToDefault = useCallback(() => {
    const defaultConfig = getDefaultConfig(widgetId);
    setConfig(defaultConfig);
    localStorage.setItem(storageKey, JSON.stringify(defaultConfig));
  }, [widgetId, storageKey]);
  
  return { config, saveConfig, resetToDefault };
}
