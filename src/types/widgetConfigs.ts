export interface BaseWidgetConfig {
  displayType: 'chart' | 'table' | 'cards' | 'gauge';
  colorScheme: string;
  refreshInterval: 5 | 30 | 60 | 300;
  compactMode: boolean;
  dataFilters: {
    dateRange?: 'today' | 'week' | 'month';
    branchIds?: string[];
  };
}

export interface SalesWidgetConfig extends BaseWidgetConfig {
  comparisonPeriod: 'yesterday' | 'lastWeek' | 'lastMonth';
  goalTracking: { enabled: boolean; dailyTarget: number };
  showSparklines: boolean;
  showTrends: boolean;
  showTrendFooter: boolean;
}

export interface QuickPOSConfig extends BaseWidgetConfig {
  displayDensity: 'compact' | 'full';
  itemsPerRow: 2 | 3;
  showImages: boolean;
  quickAddMode: boolean;
  defaultCategoryId?: string;
  cartPosition: 'bottom' | 'side';
}

export interface RevenueChartConfig extends BaseWidgetConfig {
  timeGranularity: 'hourly' | 'daily' | 'weekly';
  chartType: 'area' | 'line' | 'bar';
  showDataPoints: boolean;
  yAxisRange: 'auto' | 'manual';
  showMovingAverage: boolean;
}

export interface TopItemsConfig extends BaseWidgetConfig {
  sortBy: 'quantity' | 'revenue' | 'profit';
  topN: 3 | 5 | 10 | 20;
  showImages: boolean;
  showPercentages: boolean;
  showComparison: boolean;
}

export interface LowStockConfig extends BaseWidgetConfig {
  alertThreshold: { critical: number; low: number };
  sortBy: 'stockLevel' | 'alphabetical' | 'lastUpdated';
  maxItems: 3 | 5 | 10;
}

export interface ActiveShiftsConfig extends BaseWidgetConfig {
  showPhotos: boolean;
  showRoles: boolean;
  showLaborCost: boolean;
  timeFormat: '12hr' | '24hr';
  groupBy: 'role' | 'shiftTime' | 'alphabetical';
  viewMode: 'grid' | 'list';
}

export interface LoyaltyStatsConfig extends BaseWidgetConfig {
  showTierProgress: boolean;
  topNCustomers: 3 | 5 | 10;
  showCustomerPhotos: boolean;
  showPointsConversion: boolean;
  showRedemptionRate: boolean;
}

export interface ActiveOrdersConfig extends BaseWidgetConfig {
  statusFilters: ('pending' | 'preparing')[];
  sortBy: 'orderTime' | 'tableNumber' | 'priority';
  showTimer: boolean;
  alertThresholdMinutes: number;
  viewMode: 'list' | 'kanban';
  compactMode: boolean;
}

export interface LaborCostConfig extends BaseWidgetConfig {
  targetPercentage: number;
  showSparkline: boolean;
  showOvertimeAlert: boolean;
}

export interface EightySixConfig extends BaseWidgetConfig {
  maxItems: 3 | 5 | 10;
  showLastUpdated: boolean;
}

export interface PendingModsConfig extends BaseWidgetConfig {
  maxItems: 3 | 5 | 7 | 10;
  showWastageCost: boolean;
  sortBy: 'time' | 'wastage';
}

export interface WebVitalsConfig extends BaseWidgetConfig {
  showAlertCount: boolean;
  thresholds: {
    lcp: number;
    fid: number;
    cls: number;
    tti: number;
  };
}
