import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer } from "recharts";

interface SalesHeatmapProps {
  data: Array<{
    hour: number;
    day: number;
    sales: number;
  }>;
}

export function SalesHeatmap({ data }: SalesHeatmapProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const maxSales = Math.max(...data.map(d => d.sales), 1);

  const getColorIntensity = (sales: number) => {
    const intensity = sales / maxSales;
    if (intensity === 0) return 'hsl(var(--muted))';
    if (intensity < 0.2) return 'hsl(210, 100%, 95%)';
    if (intensity < 0.4) return 'hsl(210, 100%, 85%)';
    if (intensity < 0.6) return 'hsl(210, 80%, 70%)';
    if (intensity < 0.8) return 'hsl(210, 70%, 55%)';
    return 'hsl(210, 90%, 40%)';
  };

  const getSalesForCell = (hour: number, day: number) => {
    const cell = data.find(d => d.hour === hour && d.day === day);
    return cell?.sales || 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Heatmap</CardTitle>
        <CardDescription>Sales volume by hour and day of week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-1">
              <div></div>
              {hours.map(hour => (
                <div key={hour} className="text-center text-xs text-muted-foreground">
                  {hour}
                </div>
              ))}
              
              {days.map((day, dayIndex) => (
                <>
                  <div key={`label-${day}`} className="flex items-center text-sm font-medium">
                    {day}
                  </div>
                  {hours.map(hour => {
                    const sales = getSalesForCell(hour, dayIndex);
                    return (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className="aspect-square rounded transition-colors hover:ring-2 hover:ring-primary"
                        style={{ backgroundColor: getColorIntensity(sales) }}
                        title={`${day} ${hour}:00 - RM ${sales.toFixed(2)}`}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-end gap-4">
          <span className="text-xs text-muted-foreground">Low</span>
          <div className="flex gap-1">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, i) => (
              <div
                key={i}
                className="h-4 w-8 rounded"
                style={{ backgroundColor: getColorIntensity(intensity * maxSales) }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </CardContent>
    </Card>
  );
}
