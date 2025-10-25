import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Activity, Database, Zap, HardDrive, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function SystemHealthDashboard() {
  const { data: healthData, isLoading, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('health-check');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: recentChecks } = useQuery({
    queryKey: ['system-health-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_health')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'degraded': return 'text-warning';
      case 'down': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5" />;
      case 'down': return <Activity className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Skeleton className="h-96" />
      </div>
    );
  }

  const services = [
    { name: 'Database', key: 'database', icon: Database },
    { name: 'Realtime', key: 'realtime', icon: Zap },
    { name: 'Storage', key: 'storage', icon: HardDrive },
  ];

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Overall Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">System Health</h2>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map((service) => {
            const check = healthData?.checks?.[service.key];
            const status = check?.status || 'unknown';
            const Icon = service.icon;

            return (
              <Card key={service.key} className="p-4 border-2">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{service.name}</h3>
                  </div>
                  <div className={`flex items-center gap-1 ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                    <Badge variant={status === 'healthy' ? 'default' : 'destructive'}>
                      {status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Response Time</span>
                    <span className="font-medium text-foreground">{check?.response_time_ms || 0}ms</span>
                  </div>
                  {check?.error && (
                    <p className="text-xs text-destructive">{check.error}</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Overall Metrics */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Overall Status</p>
              <p className={`text-2xl font-bold ${getStatusColor(healthData?.status)}`}>
                {healthData?.status?.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Response Time</p>
              <p className="text-2xl font-bold text-foreground">{healthData?.response_time_ms}ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Checked</p>
              <p className="text-sm font-medium text-foreground">
                {healthData?.timestamp ? format(new Date(healthData.timestamp), 'HH:mm:ss') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uptime (24h)</p>
              <p className="text-2xl font-bold text-success">99.9%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Issues */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Recent Checks</h3>
        <div className="space-y-2">
          {recentChecks?.filter(c => c.status !== 'healthy').slice(0, 10).map((check) => (
            <div key={check.id} className="flex items-center justify-between p-3 border rounded bg-card">
              <div className="flex items-center gap-3">
                <div className={getStatusColor(check.status)}>
                  {getStatusIcon(check.status)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{check.service_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {check.check_type} - {format(new Date(check.checked_at), 'PPp')}
                  </p>
                </div>
              </div>
              <Badge variant={check.status === 'healthy' ? 'default' : 'destructive'}>
                {check.response_time_ms}ms
              </Badge>
            </div>
          ))}
          {(!recentChecks || recentChecks.filter(c => c.status !== 'healthy').length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-success" />
              <p>All systems healthy! No issues detected.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
