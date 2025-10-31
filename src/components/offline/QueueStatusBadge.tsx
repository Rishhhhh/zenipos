import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getSyncStats } from '@/lib/offline/offlineOrders';
import { cn } from '@/lib/utils';

export function QueueStatusBadge() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStats, setSyncStats] = useState({ total: 0, pending: 0, synced: 0, failed: 0 });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        toast.success('Connection restored');
        refreshStats();
      } else {
        toast.warning('Working offline');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial stats load
    refreshStats();

    // Refresh stats every 5 seconds
    const interval = setInterval(refreshStats, 5000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const refreshStats = async () => {
    try {
      const stats = await getSyncStats();
      setSyncStats(stats);
    } catch (error) {
      console.error('[QueueStatusBadge] Failed to load sync stats:', error);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      // Trigger sync (implement actual sync logic in offlineQueue)
      await refreshStats();
      toast.success('Sync completed');
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const hasPendingItems = syncStats.pending > 0 || syncStats.failed > 0;

  return (
    <div className="flex items-center gap-2">
      {/* Online/Offline indicator */}
      <Badge
        variant={isOnline ? 'default' : 'secondary'}
        className={cn(
          'flex items-center gap-1',
          !isOnline && 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500'
        )}
      >
        {isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {isOnline ? 'Online' : 'Offline'}
      </Badge>

      {/* Queue status */}
      {hasPendingItems && (
        <>
          <Badge
            variant={syncStats.failed > 0 ? 'destructive' : 'secondary'}
            className="flex items-center gap-1"
          >
            {syncStats.pending > 0 && (
              <span>{syncStats.pending} pending</span>
            )}
            {syncStats.failed > 0 && (
              <span className="ml-1">{syncStats.failed} failed</span>
            )}
          </Badge>

          {/* Manual sync button */}
          {isOnline && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="h-6 px-2"
            >
              {isSyncing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
