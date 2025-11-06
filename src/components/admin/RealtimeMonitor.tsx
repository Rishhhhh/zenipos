import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { realtimeService } from '@/lib/realtime/RealtimeService';
import { Activity, Database, Users, TrendingUp } from 'lucide-react';

/**
 * Realtime Subscription Monitor
 * Displays active channels and subscriber counts for debugging
 */
export function RealtimeMonitor() {
  const [stats, setStats] = useState(realtimeService.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(realtimeService.getStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Realtime Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Channels</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.activeChannels}</p>
          </div>

          <div className="p-3 bg-success/10 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Subscribers</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalSubscribers}</p>
          </div>

          <div className="p-3 bg-blue-500/10 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Created</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.channelsCreated}</p>
          </div>

          <div className="p-3 bg-orange-500/10 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-orange-500 rotate-180" />
              <span className="text-xs text-muted-foreground">Removed</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.channelsRemoved}</p>
          </div>
        </div>

        {/* Active Channels List */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Active Channels</h4>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {stats.channels.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No active channels
                </p>
              ) : (
                stats.channels.map((channel) => (
                  <div
                    key={channel.key}
                    className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <code className="text-xs font-mono text-foreground">
                        {channel.key}
                      </code>
                      <Badge
                        variant={channel.state === 'joined' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {channel.state}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>
                        {channel.subscribers} subscriber{channel.subscribers !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Health Status */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">System Health</span>
            <Badge
              variant={stats.activeChannels > 0 ? 'default' : 'secondary'}
              className="bg-success/20 text-success"
            >
              {stats.activeChannels > 0 ? 'Operational' : 'Idle'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
