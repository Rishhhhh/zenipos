import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationSettings() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <BellOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Push notifications are not supported in this browser</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Push Notifications</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Enable Notifications</Label>
          <Button
            variant={isSubscribed ? 'destructive' : 'default'}
            size="sm"
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              'Loading...'
            ) : isSubscribed ? (
              <>
                <BellOff className="h-4 w-4 mr-2" />
                Disable
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Enable
              </>
            )}
          </Button>
        </div>

        {isSubscribed && (
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Notify me about:</p>
            <div className="flex items-center justify-between">
              <Label htmlFor="low-stock">Low Stock Items</Label>
              <Switch id="low-stock" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="offline-device">Offline Devices</Label>
              <Switch id="offline-device" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sales-milestone">Sales Milestones</Label>
              <Switch id="sales-milestone" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="order-alert">Order Alerts</Label>
              <Switch id="order-alert" defaultChecked />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
