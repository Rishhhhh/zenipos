import { GlassModal } from '@/components/modals/GlassModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, Loader2, TrendingUp, AlertCircle } from 'lucide-react';

interface AIForecastPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lowStockItems: any[];
}

export function AIForecastPanel({ open, onOpenChange, lowStockItems }: AIForecastPanelProps) {
  const { toast } = useToast();
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runForecast = async () => {
    setIsLoading(true);
    try {
      const itemIds = lowStockItems.map(item => item.id);
      
      const { data, error } = await supabase.functions.invoke('inventory-forecast', {
        body: { inventory_item_ids: itemIds },
      });

      if (error) throw error;

      setForecasts(data.forecasts || []);
      
      toast({
        title: 'AI Forecast Complete',
        description: `Analyzed ${data.forecasts?.length || 0} items`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Forecast Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title="AI Inventory Forecast"
      size="xl"
      variant="default"
    >
      {forecasts.length === 0 ? (
        <div className="py-12 text-center">
          <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI-Powered Reorder Suggestions</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Our AI analyzes your 30-day usage patterns, wastage rates, and current stock levels
            to suggest optimal reorder quantities.
          </p>
          
          {lowStockItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No low stock items to forecast. All items are above reorder point.
            </p>
          ) : (
            <Button onClick={runForecast} disabled={isLoading} size="lg">
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Generate Forecast for {lowStockItems.length} Items
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {forecasts.length} items analyzed
            </p>
            <Button onClick={runForecast} disabled={isLoading} variant="outline" size="sm">
              {isLoading ? (
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              ) : (
                <Brain className="h-3 w-3 mr-2" />
              )}
              Re-run Forecast
            </Button>
          </div>

          {forecasts.map((forecast, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{forecast.item_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Current: {forecast.current_stock} {forecast.unit} | 
                    Avg Daily: {forecast.avg_daily_usage.toFixed(2)} {forecast.unit}
                  </p>
                </div>
                <Badge variant={getUrgencyColor(forecast.urgency)}>
                  {forecast.urgency.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-primary/5 p-3 rounded">
                  <p className="text-xs text-muted-foreground">Suggested Reorder</p>
                  <p className="text-xl font-bold text-primary">
                    {forecast.reorder_qty} {forecast.unit}
                  </p>
                </div>
                <div className="bg-warning/5 p-3 rounded">
                  <p className="text-xs text-muted-foreground">Days Until Stockout</p>
                  <p className="text-xl font-bold text-warning">
                    {forecast.days_until_stockout} days
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm"><strong>AI Reasoning:</strong></p>
                <p className="text-sm text-muted-foreground">{forecast.reasoning}</p>
              </div>

              {forecast.red_flags && forecast.red_flags.length > 0 && (
                <div className="mt-4 flex items-start gap-2 bg-destructive/10 p-3 rounded">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Red Flags:</p>
                    <ul className="text-sm text-destructive/80 list-disc list-inside">
                      {forecast.red_flags.map((flag: string, i: number) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </GlassModal>
  );
}
