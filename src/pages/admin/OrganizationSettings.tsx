import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettingsPanel } from '@/components/admin/settings/GeneralSettingsPanel';
import { BrandingSettingsPanel } from '@/components/admin/settings/BrandingSettingsPanel';
import { SecuritySettingsPanel } from '@/components/admin/settings/SecuritySettingsPanel';
import { BillingPlaceholderPanel } from '@/components/admin/settings/BillingPlaceholderPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OrganizationSettings() {
  return (
    <div className="container mx-auto p-8 pb-32 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage your restaurant's information, branding, and security settings
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettingsPanel />
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <BrandingSettingsPanel />
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branch Management</CardTitle>
              <CardDescription>
                Manage your restaurant locations and assign managers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Branch Management</p>
                    <p className="text-sm text-muted-foreground">
                      Add, edit, or deactivate branches and assign managers
                    </p>
                  </div>
                </div>
                <Link to="/admin/branches">
                  <Button>
                    Manage Branches
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettingsPanel />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <BillingPlaceholderPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
