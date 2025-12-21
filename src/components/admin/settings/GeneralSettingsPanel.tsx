import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useSpeedMode } from '@/hooks/useSpeedMode';
import { useNavbarConfig, DEFAULT_NAVBAR_MODULES } from '@/hooks/useNavbarConfig';
import { DOCK_APPS } from '@/components/navigation/dockConfig';
import { Loader2, Zap, Menu, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  const { savedModules, updateNavbarModules, isUpdating: isUpdatingNavbar } = useNavbarConfig();
  
  // Local state for navbar modules
  const [selectedModules, setSelectedModules] = useState<string[]>(savedModules);
  
  // Sync with saved modules when they change
  useEffect(() => {
    setSelectedModules(savedModules);
  }, [savedModules]);

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

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    const newModules = checked
      ? [...selectedModules, moduleId]
      : selectedModules.filter(id => id !== moduleId);
    setSelectedModules(newModules);
  };

  const handleSaveNavbar = () => {
    updateNavbarModules(selectedModules);
  };

  const hasNavbarChanges = JSON.stringify(selectedModules.sort()) !== JSON.stringify(savedModules.sort());

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
            Ultimate fast mode: Skip NFC card selection, auto-bump KDS orders in 5 seconds,
            simplified 4-module navbar, and all animations disabled for 60fps performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="speed-mode" className="text-base font-medium">
                Enable Speed Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                POS → Tables → Cashbook → Admin only
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

      {/* Navbar Configuration Card - Only visible when Speed Mode is OFF */}
      {!speedMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Menu className="h-5 w-5" />
              Navbar Modules
            </CardTitle>
            <CardDescription>
              Choose which modules appear in the navigation dock
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DOCK_APPS.map((app) => (
                <div key={app.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`module-${app.id}`}
                    checked={selectedModules.includes(app.id)}
                    onCheckedChange={(checked) => handleModuleToggle(app.id, !!checked)}
                  />
                  <Label 
                    htmlFor={`module-${app.id}`} 
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <app.icon className="h-4 w-4 text-muted-foreground" />
                    {app.label}
                  </Label>
                </div>
              ))}
            </div>
            
            {selectedModules.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                At least one module must be selected
              </div>
            )}
            
            <div className="flex items-center gap-2 pt-2">
              <Button 
                onClick={handleSaveNavbar} 
                disabled={!hasNavbarChanges || isUpdatingNavbar || selectedModules.length === 0}
                size="sm"
              >
                {isUpdatingNavbar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Navbar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedModules(DEFAULT_NAVBAR_MODULES)}
                disabled={JSON.stringify(selectedModules.sort()) === JSON.stringify(DEFAULT_NAVBAR_MODULES.sort())}
              >
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
