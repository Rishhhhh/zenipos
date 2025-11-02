import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getWidgetById } from "@/lib/widgets/widgetCatalog";
import { 
  BaseWidgetConfig,
  QuickPOSConfig,
  SalesWidgetConfig,
  RevenueChartConfig,
  TopItemsConfig,
  LowStockConfig,
  ActiveShiftsConfig,
  LoyaltyStatsConfig,
  ActiveOrdersConfig
} from "@/types/widgetConfigs";

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
export function getDefaultConfig(widgetType: string): BaseWidgetConfig {
  const baseConfig = {
    displayType: getDefaultDisplayType(widgetType),
    colorScheme: 'auto',
    refreshInterval: 30 as const,
    compactMode: false,
    dataFilters: {},
  };

  // Widget-specific defaults
  switch (widgetType) {
    case 'quick-pos':
      return {
        ...baseConfig,
        displayDensity: 'full',
        itemsPerRow: 3,
        showImages: true,
        quickAddMode: true,
        defaultCategoryId: undefined,
        cartPosition: 'side',
      } as QuickPOSConfig;

    case 'sales':
      return {
        ...baseConfig,
        comparisonPeriod: 'yesterday',
        goalTracking: { enabled: false, dailyTarget: 0 },
        showSparklines: true,
        showTrends: true,
        showTrendFooter: true,
      } as SalesWidgetConfig;

    case 'revenue-chart':
      return {
        ...baseConfig,
        timeGranularity: 'hourly',
        chartType: 'area',
        showDataPoints: true,
        yAxisRange: 'auto',
        showMovingAverage: false,
      } as RevenueChartConfig;

    case 'top-items':
      return {
        ...baseConfig,
        sortBy: 'quantity',
        topN: 5,
        showImages: false,
        showPercentages: true,
        showComparison: true,
      } as TopItemsConfig;

    case 'low-stock':
      return {
        ...baseConfig,
        alertThreshold: { critical: 10, low: 30 },
        sortBy: 'stockLevel',
        maxItems: 3,
      } as LowStockConfig;

    case 'active-shifts':
      return {
        ...baseConfig,
        showPhotos: true,
        showRoles: true,
        showLaborCost: false,
        timeFormat: '12hr',
        groupBy: 'shiftTime',
      } as ActiveShiftsConfig;

    case 'loyalty-stats':
      return {
        ...baseConfig,
        showTierProgress: true,
        topNCustomers: 5,
        showCustomerPhotos: true,
        showPointsConversion: true,
        showRedemptionRate: true,
      } as LoyaltyStatsConfig;

    case 'active-orders':
      return {
        ...baseConfig,
        statusFilters: ['pending', 'preparing'],
        sortBy: 'orderTime',
        showTimer: true,
        alertThresholdMinutes: 15,
        viewMode: 'list',
        compactMode: false,
      } as ActiveOrdersConfig;

    default:
      return baseConfig;
  }
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

  // Listen for config updates (both cross-tab and same-tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const newConfig = JSON.parse(e.newValue) as T;
          setConfig(newConfig);
        } catch {
          // Ignore parse errors
        }
      }
    };

    const handleConfigUpdate = (e: CustomEvent) => {
      if (e.detail?.widgetId === widgetId) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const newConfig = JSON.parse(saved) as T;
            setConfig(newConfig);
          } catch {
            // Ignore parse errors
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('widget-config-updated', handleConfigUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('widget-config-updated', handleConfigUpdate as EventListener);
    };
  }, [storageKey, widgetId]);
  
  return { config, saveConfig, resetToDefault };
}
