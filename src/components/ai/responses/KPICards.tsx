import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from "lucide-react";

interface KPICardsProps {
  data: any;
}

export function KPICards({ data }: KPICardsProps) {
  if (!data) return null;

  const kpis = [
    {
      title: "Total Revenue",
      value: `RM ${parseFloat(data.total_revenue || 0).toFixed(2)}`,
      icon: DollarSign,
      trend: data.revenue_trend,
      color: "text-green-500"
    },
    {
      title: "Total Orders",
      value: data.total_orders || 0,
      icon: ShoppingCart,
      trend: data.orders_trend,
      color: "text-blue-500"
    },
    {
      title: "Active Staff",
      value: data.active_staff || 0,
      icon: Users,
      trend: null,
      color: "text-purple-500"
    },
    {
      title: "Low Stock Items",
      value: data.low_stock_count || 0,
      icon: Package,
      trend: null,
      color: "text-orange-500"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <Card key={idx} className="p-4 bg-card border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{kpi.title}</p>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                {kpi.trend !== null && kpi.trend !== undefined && (
                  <div className={`flex items-center gap-1 text-xs ${
                    kpi.trend > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {kpi.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{Math.abs(kpi.trend)}%</span>
                  </div>
                )}
              </div>
              <Icon className={`w-8 h-8 ${kpi.color}`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
