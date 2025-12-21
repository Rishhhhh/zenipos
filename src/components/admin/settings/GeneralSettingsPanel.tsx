import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useSpeedMode } from '@/hooks/useSpeedMode';
import { Loader2, Zap } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Restaurant name must be at least 2 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
  businessType: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function GeneralSettingsPanel() {
  const { settings, updateSettings, isUpdating } = useOrganizationSettings();
  const { speedMode, toggleSpeedMode, isToggling } = useSpeedMode();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      name: settings?.name || '',
      phone: settings?.phone || '',
      address: settings?.address || '',
      businessType: settings?.business_type || '',
    },
  });

  const onSubmit = (data: FormData) => {
    updateSettings(data);
  };

  return (
    <div className="space-y-6">
      {/* Speed Mode Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Speed Mode
          </CardTitle>
          <CardDescription>
            Skip order confirmation and KDS steps. Orders go directly to "ready for payment" status.
            Perfect for quick-service restaurants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="speed-mode" className="text-base font-medium">
                Enable Speed Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                One-click ordering with instant kitchen delivery
              </p>
            </div>
            <Switch
              id="speed-mode"
              checked={speedMode}
              onCheckedChange={toggleSpeedMode}
              disabled={isToggling}
            />
          </div>
        </CardContent>
      </Card>

      {/* General Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Update your restaurant's basic information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="My Restaurant"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...register('phone')}
                type="tel"
                placeholder="+60 12-345 6789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="123 Main Street, City, State 12345"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Input
                id="businessType"
                {...register('businessType')}
                placeholder="e.g., Fine Dining, Fast Food, Cafe"
              />
            </div>

            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
