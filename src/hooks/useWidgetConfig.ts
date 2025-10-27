import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getWidgetById } from "@/lib/widgets/widgetCatalog";
import { BaseWidgetConfig } from "@/types/widgetConfigs";

export interface WidgetConfig extends BaseWidgetConfig {}

/**
 * Get default display type from widget capabilities
 */
export function getDefaultDisplayType(widgetId: string): 'chart' | 'table' | 'cards' | 'gauge' {
  const widgetDef = getWidgetById(widgetId);
  
  if (!widgetDef) return 'cards';
  
  // Use first supported display type as default
  return widgetDef.capabilities.supportedDisplayTypes[0];
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
 * Hook to manage per-user widget configuration with generic types
 */
export function useWidgetConfig<T extends BaseWidgetConfig = WidgetConfig>(widgetId: string) {
  const { employee } = useAuth();
  const storageKey = `widget_config_${employee?.id || 'default'}_${widgetId}`;
  
  const [config, setConfig] = useState<T>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved) as T;
      } catch {
        return getDefaultConfig(widgetId) as T;
      }
    }
    return getDefaultConfig(widgetId) as T;
  });
  
  const saveConfig = useCallback((newConfig: T) => {
    setConfig(newConfig);
    localStorage.setItem(storageKey, JSON.stringify(newConfig));
  }, [storageKey]);

  const resetToDefault = useCallback(() => {
    const defaultConfig = getDefaultConfig(widgetId) as T;
    setConfig(defaultConfig);
    localStorage.setItem(storageKey, JSON.stringify(defaultConfig));
  }, [widgetId, storageKey]);
  
  return { config, saveConfig, resetToDefault };
}
