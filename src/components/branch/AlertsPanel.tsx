import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, CheckCircle, XCircle, Bell, BellOff } from 'lucide-react';
import { useState } from 'react';

export function AlertsPanel() {
  const [muted, setMuted] = useState(false);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['branch-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('branch-alerts');
      if (error) throw error;
      return data.alerts;
    },
    refetchInterval: 60000,
  });

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getVariant = (severity: string): 'default' | 'destructive' => {
    return severity === 'error' ? 'destructive' : 'default';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Alerts</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMuted(!muted)}
        >
          {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        </Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded" />)}
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert: any, idx: number) => (
            <Alert key={idx} variant={getVariant(alert.severity)}>
              <div className="flex items-start gap-3">
                {getIcon(alert.severity)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{alert.type.replace('_', ' ')}</Badge>
                    <Badge className={
                      alert.severity === 'error' ? 'bg-destructive' :
                      alert.severity === 'warning' ? 'bg-orange-500' :
                      'bg-success'
                    }>
                      {alert.severity}
                    </Badge>
                  </div>
                  <AlertDescription>{alert.message}</AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No active alerts</p>
        </div>
      )}
    </Card>
  );
}
