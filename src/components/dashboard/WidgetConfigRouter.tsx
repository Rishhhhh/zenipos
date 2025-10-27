import { QuickPOSConfigPanel } from "./widgets/config/QuickPOSConfigPanel";
import { SalesConfigPanel } from "./widgets/config/SalesConfigPanel";
import { RevenueChartConfigPanel } from "./widgets/config/RevenueChartConfigPanel";
import { TopItemsConfigPanel } from "./widgets/config/TopItemsConfigPanel";
import { LowStockConfigPanel } from "./widgets/config/LowStockConfigPanel";
import { ActiveShiftsConfigPanel } from "./widgets/config/ActiveShiftsConfigPanel";
import { LoyaltyStatsConfigPanel } from "./widgets/config/LoyaltyStatsConfigPanel";
import { ActiveOrdersConfigPanel } from "./widgets/config/ActiveOrdersConfigPanel";
import { BaseWidgetConfig } from "@/types/widgetConfigs";

interface WidgetConfigRouterProps {
  widgetId: string;
  config: any;
  onConfigChange: (config: any) => void;
}

export function WidgetConfigRouter({ widgetId, config, onConfigChange }: WidgetConfigRouterProps) {
  switch (widgetId) {
    case 'quick-pos':
      return <QuickPOSConfigPanel config={config} onConfigChange={onConfigChange} />;
    case 'sales':
      return <SalesConfigPanel config={config} onConfigChange={onConfigChange} />;
    case 'revenue-chart':
      return <RevenueChartConfigPanel config={config} onConfigChange={onConfigChange} />;
    case 'top-items':
      return <TopItemsConfigPanel config={config} onConfigChange={onConfigChange} />;
    case 'low-stock':
      return <LowStockConfigPanel config={config} onConfigChange={onConfigChange} />;
    case 'active-shifts':
      return <ActiveShiftsConfigPanel config={config} onConfigChange={onConfigChange} />;
    case 'loyalty-stats':
      return <LoyaltyStatsConfigPanel config={config} onConfigChange={onConfigChange} />;
    case 'active-orders':
      return <ActiveOrdersConfigPanel config={config} onConfigChange={onConfigChange} />;
    default:
      return (
        <div className="text-center py-8 text-muted-foreground">
          No configuration available for this widget.
        </div>
      );
  }
}
