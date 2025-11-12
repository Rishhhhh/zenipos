import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, TrendingUp, Users, Package } from 'lucide-react';

export function BillingPlaceholderPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You're currently on the Free Plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Free Plan</p>
                <p className="text-sm text-muted-foreground">Perfect for getting started</p>
              </div>
              <Badge variant="secondary">Current</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Max Branches</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Max Employees</p>
                <p className="text-2xl font-bold">10</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>
            Your current usage for this billing period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Orders This Month</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Active Employees</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Storage Used</p>
                <p className="text-2xl font-bold">0 MB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upgrade to Pro</CardTitle>
          <CardDescription>
            Unlock advanced features for your restaurant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Coming Soon</Badge>
              <p className="text-sm text-muted-foreground">
                Premium plans will be available soon
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <p className="text-sm font-medium">Pro Plan Features (Coming Soon):</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Unlimited branches</li>
                <li>• Unlimited employees</li>
                <li>• Advanced analytics</li>
                <li>• Priority support</li>
                <li>• Custom integrations</li>
                <li>• White-label branding</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
