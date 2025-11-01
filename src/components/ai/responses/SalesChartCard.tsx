import { Card } from "@/components/ui/card";
import { LazyBarChart } from "@/components/charts/LazyBarChart";

interface SalesChartCardProps {
  data: any;
}

export function SalesChartCard({ data }: SalesChartCardProps) {
  if (!data || !Array.isArray(data)) return null;

  // Transform data for recharts
  const chartData = data.map((item: any) => ({
    name: item.hour !== undefined ? `${item.hour}:00` : item.category_name || item.item_name || 'Unknown',
    value: parseFloat(item.total_sales || item.total_revenue || 0),
    count: parseInt(item.order_count || item.quantity_sold || 0)
  }));

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Sales Data</h3>
        
        <LazyBarChart data={chartData} dataKey="value" xAxisKey="name" height={300} />
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              RM {chartData.reduce((sum, item) => sum + item.value, 0).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {chartData.reduce((sum, item) => sum + item.count, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              RM {(chartData.reduce((sum, item) => sum + item.value, 0) / 
                   Math.max(chartData.reduce((sum, item) => sum + item.count, 0), 1)).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Avg Ticket</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
