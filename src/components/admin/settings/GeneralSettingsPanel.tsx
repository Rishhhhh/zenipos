import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Restaurant name must be at least 2 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
  businessType: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function GeneralSettingsPanel() {
  const { settings, updateSettings, isUpdating } = useOrganizationSettings();

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
  );
}
