import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Coins, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { hardwareClient, type HardwareEvent } from '@/lib/hardware/HardwareClient';

export function HardwareStatusStrip() {
  const [connected, setConnected] = useState(false);
  const [hopperStatus, setHopperStatus] = useState<'ok' | 'low' | 'jam'>('ok');

  useEffect(() => {
    const handleConnected = () => setConnected(true);
    const handleDisconnected = () => setConnected(false);
    
    const handleHopperLevel = (event: HardwareEvent) => {
      const { hoppers } = event.data;
      const hasLow = hoppers.some((h: any) => h.currentLevel < h.lowThreshold);
      setHopperStatus(hasLow ? 'low' : 'ok');
    };

    const handleJam = () => setHopperStatus('jam');

    hardwareClient.on('connected', handleConnected);
    hardwareClient.on('disconnected', handleDisconnected);
    hardwareClient.on('hopper_level', handleHopperLevel);
    hardwareClient.on('jam', handleJam);

    // Initial connection attempt
    if (!hardwareClient.isConnected()) {
      hardwareClient.connect().catch(console.error);
    }

    return () => {
      hardwareClient.off('connected', handleConnected);
      hardwareClient.off('disconnected', handleDisconnected);
      hardwareClient.off('hopper_level', handleHopperLevel);
      hardwareClient.off('jam', handleJam);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Connection Status */}
      {connected ? (
        <Badge variant="default" className="gap-1">
          <Wifi className="h-3 w-3" />
          Hardware Online
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1">
          <WifiOff className="h-3 w-3" />
          Hardware Offline
        </Badge>
      )}

      {/* Hopper Status */}
      {connected && (
        <>
          {hopperStatus === 'ok' && (
            <Badge variant="secondary" className="gap-1">
              <Coins className="h-3 w-3" />
              Coins OK
            </Badge>
          )}
          {hopperStatus === 'low' && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Low Coins
            </Badge>
          )}
          {hopperStatus === 'jam' && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Coin Jam
            </Badge>
          )}
        </>
      )}
    </div>
  );
}
