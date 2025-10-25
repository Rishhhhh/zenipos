import { MagicBento } from "@/components/ui/magic-bento";
import { DollarSign, TrendingUp, Percent, Users, AlertTriangle, XCircle } from "lucide-react";

interface KPICardsProps {
  data: {
    salesPerHour: number;
    cogsPercentage: number;
    foodCostPercentage: number;
    avgTicket: number;
    laborPercentage: number;
    voidRate: number;
  };
  sparklineData?: {
    sales: number[];
    cogs: number[];
  };
}

export function KPICards({ data, sparklineData }: KPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MagicBento
        title="Sales per Hour"
        value={`RM ${data.salesPerHour.toFixed(2)}`}
        icon={<DollarSign className="h-6 w-6" />}
        sparklineData={sparklineData?.sales}
        subtitle="Average hourly revenue"
      />

      <MagicBento
        title="COGS %"
        value={`${data.cogsPercentage.toFixed(1)}%`}
        icon={<Percent className="h-6 w-6" />}
        threshold={{ warning: 35, danger: 40 }}
        subtitle="Cost of goods sold"
      />

      <MagicBento
        title="Food Cost %"
        value={`${data.foodCostPercentage.toFixed(1)}%`}
        icon={<TrendingUp className="h-6 w-6" />}
        threshold={{ warning: 35, danger: 40 }}
        subtitle="Target: ≤ 35%"
      />

      <MagicBento
        title="Avg Ticket"
        value={`RM ${data.avgTicket.toFixed(2)}`}
        icon={<Users className="h-6 w-6" />}
        subtitle="Average order value"
      />

      <MagicBento
        title="Labor %"
        value={`${data.laborPercentage.toFixed(1)}%`}
        icon={<AlertTriangle className="h-6 w-6" />}
        threshold={{ warning: 30, danger: 35 }}
        subtitle="Labor cost percentage"
      />

      <MagicBento
        title="Void Rate"
        value={`${data.voidRate.toFixed(2)}%`}
        icon={<XCircle className="h-6 w-6" />}
        threshold={{ warning: 2, danger: 5 }}
        subtitle="Percentage of voided items"
      />
    </div>
  );
}
