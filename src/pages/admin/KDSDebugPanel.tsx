import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, Activity, AlertCircle, CheckCircle, 
  RefreshCw, Server, Zap 
} from 'lucide-react';
import { useRealtimeTable } from '@/lib/realtime/RealtimeService';
import { useState } from 'react';

export default function KDSDebugPanel() {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Query 1: Items by station (including NULL)
  const { data: itemsByStation, refetch: refetchStations } = useQuery({
    queryKey: ['debug-items-by-station'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_items_by_station_debug');
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  // Query 2: Items by status
  const { data: itemsByStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['debug-items-by-status'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_items_by_status_debug');
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  // Query 3: Recent order items with full routing info
  const { data: recentItems, refetch: refetchRecent } = useQuery({
    queryKey: ['debug-recent-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id,
          created_at,
          status,
          station_id,
          prep_time_actual,
          order:orders!inner(id, status, order_type),
          menu_item:menu_items(id, name, station_id, prep_time_minutes),
          station:stations(id, name, type)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 3000,
  });

  // Query 4: Check if trigger exists
  const { data: triggerInfo } = useQuery({
    queryKey: ['debug-trigger-check'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_kds_trigger_exists');
      if (error) throw error;
      return data?.[0] || { enabled: false };
    },
  });

  // Real-time updates
  useRealtimeTable('order_items', () => {
    setLastUpdate(new Date());
    refetchStations();
    refetchStatus();
    refetchRecent();
  });

  const refreshAll = () => {
    refetchStations();
    refetchStatus();
    refetchRecent();
    queryClient.invalidateQueries({ queryKey: ['debug-trigger-check'] });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">KDS Debug Panel</h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring of KDS routing and status pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            Last update: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <Button onClick={refreshAll} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Trigger Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Trigger Status
        </h2>
        {triggerInfo?.enabled ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>auto_route_order_items trigger is ACTIVE</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>auto_route_order_items trigger is MISSING or DISABLED</span>
          </div>
        )}
      </Card>

      {/* Items by Station */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Server className="h-5 w-5" />
          Items by Station
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {itemsByStation?.map((station: any) => (
            <Card key={station.station_id || 'null'} className="p-4">
              <div className="text-sm text-muted-foreground mb-1">
                {station.station_name || 'NO STATION (NULL)'}
              </div>
              <div className="text-3xl font-bold">
                {station.item_count}
              </div>
              {station.station_id === null && station.item_count > 0 && (
                <Badge variant="destructive" className="mt-2 text-xs">
                  ⚠️ Items missing station_id
                </Badge>
              )}
            </Card>
          ))}
        </div>
      </Card>

      {/* Items by Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Items by Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {itemsByStatus?.map((status: any) => (
            <Card key={status.status || 'null'} className="p-4">
              <div className="text-sm text-muted-foreground mb-1">
                {status.status || 'NO STATUS'}
              </div>
              <div className="text-3xl font-bold">
                {status.item_count}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Recent Items Table */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Recent Order Items (Last 20)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="py-2 px-3">Created</th>
                <th className="py-2 px-3">Item</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Station (Item)</th>
                <th className="py-2 px-3">Station (Menu)</th>
                <th className="py-2 px-3">Prep Time</th>
                <th className="py-2 px-3">Routing</th>
              </tr>
            </thead>
            <tbody>
              {recentItems?.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 text-xs">
                    {new Date(item.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3">
                    {item.menu_item?.name || 'Unknown'}
                  </td>
                  <td className="py-2 px-3">
                    <Badge variant="outline">{item.status}</Badge>
                  </td>
                  <td className="py-2 px-3">
                    {item.station_id ? (
                      <span className="text-green-600 font-medium">
                        {item.station?.name}
                      </span>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        NULL
                      </Badge>
                    )}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {item.menu_item?.station_id ? '✓' : '✗'}
                  </td>
                  <td className="py-2 px-3">
                    {item.prep_time_actual ? `${item.prep_time_actual}s` : '—'}
                  </td>
                  <td className="py-2 px-3">
                    {item.station_id && item.prep_time_actual ? (
                      <Badge variant="default" className="text-xs">
                        ✓ Routed
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        ✗ Failed
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
