import { useState, useEffect } from 'react';
import {
  Settings, Wrench, Shield, ToggleLeft, ToggleRight,
  AlertTriangle, Power, Save, RefreshCw, Loader2,
  Lock, Users, Package, Heart, Globe, Sliders
} from 'lucide-react';
import { adminSettingsApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Setting {
  id: string;
  key: string;
  value: any;
  type: 'boolean' | 'string' | 'number' | 'json';
  description: string;
  category: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, Setting[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changedSettings, setChangedSettings] = useState<Record<string, any>>({});
  const [emergencyDialog, setEmergencyDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await adminSettingsApi.getAll();
      setSettings(data.settings);
      setChangedSettings({});
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setChangedSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getSettingValue = (category: string, key: string): any => {
    const categorySettings = settings[category] || [];
    const setting = categorySettings.find(s => s.key === key);
    if (changedSettings[key] !== undefined) {
      return changedSettings[key];
    }
    return setting?.value;
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(changedSettings).map(([key, value]) => ({ key, value }));
      await adminSettingsApi.updateBulk(updates);
      
      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      });
      
      setChangedSettings({});
      await loadSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleMaintenance = async () => {
    try {
      const result = await adminSettingsApi.toggleMaintenanceMode();
      toast({
        title: result.maintenance_mode ? 'Maintenance Enabled' : 'Maintenance Disabled',
        description: result.message,
      });
      await loadSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle maintenance mode',
        variant: 'destructive',
      });
    }
  };

  const handleEmergencyShutdown = async () => {
    try {
      const result = await adminSettingsApi.emergencyShutdown();
      toast({
        title: 'Emergency Shutdown Activated',
        description: result.message,
        variant: 'destructive',
      });
      setEmergencyDialog(false);
      await loadSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to activate emergency shutdown',
        variant: 'destructive',
      });
    }
  };

  const hasChanges = Object.keys(changedSettings).length > 0;
  const maintenanceMode = getSettingValue('system', 'maintenance_mode') || false;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            System Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage system-wide settings and feature toggles
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSettings} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={saveSettings} disabled={!hasChanges || saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Maintenance Mode Alert */}
      {maintenanceMode && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Maintenance Mode Active</AlertTitle>
          <AlertDescription>
            The website is currently in maintenance mode. All public access is disabled.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">
            <Wrench className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="features">
            <ToggleLeft className="w-4 h-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="general">
            <Globe className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="limits">
            <Sliders className="w-4 h-4 mr-2" />
            Limits
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Power className="w-5 h-5" />
                Maintenance Mode
              </CardTitle>
              <CardDescription>
                Enable maintenance mode to disable all public access to the website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, only admins can access the website
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {maintenanceMode && <Badge variant="destructive">Active</Badge>}
                  <Button
                    variant={maintenanceMode ? "destructive" : "default"}
                    onClick={toggleMaintenance}
                  >
                    {maintenanceMode ? 'Disable' : 'Enable'} Maintenance
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_message">Maintenance Message</Label>
                <Textarea
                  id="maintenance_message"
                  value={getSettingValue('system', 'maintenance_message') || ''}
                  onChange={(e) => updateSetting('maintenance_message', e.target.value)}
                  placeholder="We are currently performing maintenance..."
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  This message will be shown to users when maintenance mode is active
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Emergency Controls
              </CardTitle>
              <CardDescription>
                Emergency shutdown options for critical situations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Emergency Shutdown</AlertTitle>
                <AlertDescription className="mt-2">
                  This will immediately disable all API endpoints and enable maintenance mode.
                  Use only in emergency situations.
                </AlertDescription>
              </Alert>
              <Button
                variant="destructive"
                className="mt-4"
                onClick={() => setEmergencyDialog(true)}
              >
                <Power className="w-4 h-4 mr-2" />
                Activate Emergency Shutdown
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Status</CardTitle>
              <CardDescription>Control API availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Disable all API endpoints (emergency shutdown)
                  </p>
                </div>
                <Switch
                  checked={getSettingValue('system', 'api_enabled') !== false}
                  onCheckedChange={(checked) => updateSetting('api_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Settings */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new users to create accounts
                  </p>
                </div>
                <Switch
                  checked={getSettingValue('features', 'registration_enabled') !== false}
                  onCheckedChange={(checked) => updateSetting('registration_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Login</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to log in to their accounts
                  </p>
                </div>
                <Switch
                  checked={getSettingValue('features', 'login_enabled') !== false}
                  onCheckedChange={(checked) => updateSetting('login_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Product Creation</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to create new product listings
                  </p>
                </div>
                <Switch
                  checked={getSettingValue('features', 'product_creation_enabled') !== false}
                  onCheckedChange={(checked) => updateSetting('product_creation_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Product Editing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to edit their existing products
                  </p>
                </div>
                <Switch
                  checked={getSettingValue('features', 'product_editing_enabled') !== false}
                  onCheckedChange={(checked) => updateSetting('product_editing_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Wishlist Feature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Wishlist</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable wishlist functionality for users
                  </p>
                </div>
                <Switch
                  checked={getSettingValue('features', 'wishlist_enabled') !== false}
                  onCheckedChange={(checked) => updateSetting('wishlist_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  value={getSettingValue('general', 'site_name') || ''}
                  onChange={(e) => updateSetting('site_name', e.target.value)}
                  placeholder="UniCycle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_description">Site Description</Label>
                <Textarea
                  id="site_description"
                  value={getSettingValue('general', 'site_description') || ''}
                  onChange={(e) => updateSetting('site_description', e.target.value)}
                  placeholder="Campus Marketplace"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limits Settings */}
        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max_products_per_user">Max Products Per User</Label>
                <Input
                  id="max_products_per_user"
                  type="number"
                  min="1"
                  value={getSettingValue('limits', 'max_products_per_user') || 50}
                  onChange={(e) => updateSetting('max_products_per_user', parseInt(e.target.value) || 50)}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum number of products a user can list
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_images_per_product">Max Images Per Product</Label>
                <Input
                  id="max_images_per_product"
                  type="number"
                  min="1"
                  max="10"
                  value={getSettingValue('limits', 'max_images_per_product') || 5}
                  onChange={(e) => updateSetting('max_images_per_product', parseInt(e.target.value) || 5)}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum number of images allowed per product
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Require email verification for new user registrations
                  </p>
                </div>
                <Switch
                  checked={getSettingValue('security', 'require_email_verification') === true}
                  onCheckedChange={(checked) => updateSetting('require_email_verification', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Emergency Shutdown Dialog */}
      <AlertDialog open={emergencyDialog} onOpenChange={setEmergencyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Emergency Shutdown
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Disable all API endpoints</li>
                <li>Enable maintenance mode</li>
                <li>Block all public access to the website</li>
              </ul>
              <p className="mt-4 font-semibold">Are you sure you want to proceed?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmergencyShutdown}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Activate Emergency Shutdown
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}



