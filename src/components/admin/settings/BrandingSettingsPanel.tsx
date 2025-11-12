import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export function BrandingSettingsPanel() {
  const { settings, updateSettings, uploadLogo, isUpdating } = useOrganizationSettings();
  const [primaryColor, setPrimaryColor] = useState(settings?.primary_color || '#8B5CF6');
  const [accentColor, setAccentColor] = useState(settings?.accent_color || '#10B981');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    uploadLogo(file);
  };

  const handleColorSave = () => {
    updateSettings({
      primaryColor,
      accentColor,
    });
  };

  const handleResetColors = () => {
    setPrimaryColor('#8B5CF6');
    setAccentColor('#10B981');
    updateSettings({
      primaryColor: '#8B5CF6',
      accentColor: '#10B981',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>
            Upload your restaurant's logo. Recommended size: 400x400px, max 5MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {(logoPreview || settings?.logo_url) && (
              <div className="relative">
                <img
                  src={logoPreview || settings?.logo_url}
                  alt="Logo preview"
                  className="h-24 w-24 rounded-lg object-cover border border-border"
                />
                {logoPreview && (
                  <button
                    onClick={() => setLogoPreview(null)}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
            
            <div className="flex-1">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary transition-colors text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WebP (max. 5MB)
                  </p>
                </div>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={isUpdating}
                />
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
          <CardDescription>
            Customize your brand's color scheme. Changes apply immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#8B5CF6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent-color">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accent-color"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#10B981"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleColorSave} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Colors
            </Button>
            <Button variant="outline" onClick={handleResetColors}>
              Reset to Default
            </Button>
          </div>

          <div className="p-4 border border-border rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">Color Preview</p>
            <div className="flex gap-2">
              <div
                className="h-12 flex-1 rounded"
                style={{ backgroundColor: primaryColor }}
              />
              <div
                className="h-12 flex-1 rounded"
                style={{ backgroundColor: accentColor }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
