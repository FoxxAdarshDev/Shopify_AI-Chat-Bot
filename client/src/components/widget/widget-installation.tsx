import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Eye, Settings, Code, Palette } from 'lucide-react';
import { Store } from '@shared/schema';

interface WidgetInstallationProps {
  store: Store;
}

interface WidgetSettings {
  widgetColor: string;
  widgetPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  enabledPages: string[];
}

export default function WidgetInstallation({ store }: WidgetInstallationProps) {
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<WidgetSettings>({
    widgetColor: '#3B82F6',
    widgetPosition: 'bottom-right',
    enabledPages: ['home', 'product']
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: instructions } = useQuery({
    queryKey: [`/api/widget/install-instructions/${store.id}`],
    queryFn: async () => {
      const response = await fetch(`/api/widget/install-instructions/${store.id}`);
      if (!response.ok) throw new Error('Failed to fetch instructions');
      return response.json();
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: WidgetSettings) => {
      const response = await fetch(`/api/widget/settings/${store.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your widget settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/widget/install-instructions/${store.id}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update widget settings.",
        variant: "destructive"
      });
    }
  });

  const handleCopyScript = async () => {
    if (instructions?.scriptTag) {
      await navigator.clipboard.writeText(instructions.scriptTag);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Script tag copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpdateSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const pageOptions = [
    { value: 'home', label: 'Home Page', description: 'Main storefront page' },
    { value: 'product', label: 'Product Pages', description: 'Individual product pages' },
    { value: 'collection', label: 'Collection Pages', description: 'Product category pages' },
    { value: 'page', label: 'Content Pages', description: 'About, Contact, etc.' },
    { value: 'blog', label: 'Blog Pages', description: 'Blog posts and articles' }
  ];

  const positionOptions = [
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'top-left', label: 'Top Left' }
  ];

  return (
    <div className="space-y-6" data-testid="widget-installation">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Chat Widget Installation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="install" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Installation
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid gap-6">
                {/* Widget Appearance */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Widget Appearance
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="widget-color">Primary Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="widget-color"
                          type="color"
                          value={settings.widgetColor}
                          onChange={(e) => setSettings({ ...settings, widgetColor: e.target.value })}
                          className="w-20 h-10 p-1 rounded cursor-pointer"
                          data-testid="input-widget-color"
                        />
                        <Input
                          value={settings.widgetColor}
                          onChange={(e) => setSettings({ ...settings, widgetColor: e.target.value })}
                          placeholder="#3B82F6"
                          className="flex-1"
                          data-testid="input-widget-color-text"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="widget-position">Widget Position</Label>
                      <Select
                        value={settings.widgetPosition}
                        onValueChange={(value: any) => setSettings({ ...settings, widgetPosition: value })}
                      >
                        <SelectTrigger className="mt-1" data-testid="select-widget-position">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {positionOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Page Settings */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Show Widget On</h3>
                  <div className="grid gap-3">
                    {pageOptions.map((page) => (
                      <div key={page.value} className="flex items-center space-x-3">
                        <Checkbox
                          id={page.value}
                          checked={settings.enabledPages.includes(page.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSettings({
                                ...settings,
                                enabledPages: [...settings.enabledPages, page.value]
                              });
                            } else {
                              setSettings({
                                ...settings,
                                enabledPages: settings.enabledPages.filter(p => p !== page.value)
                              });
                            }
                          }}
                          data-testid={`checkbox-page-${page.value}`}
                        />
                        <div>
                          <label htmlFor={page.value} className="text-sm font-medium cursor-pointer">
                            {page.label}
                          </label>
                          <p className="text-xs text-muted-foreground">{page.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleUpdateSettings}
                  disabled={updateSettingsMutation.isPending}
                  className="w-full"
                  data-testid="button-save-settings"
                >
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </TabsContent>

            {/* Installation Tab */}
            <TabsContent value="install" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Installation Instructions</h3>
                
                {/* Script Tag */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="script-tag">Copy this script tag:</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="script-tag"
                        value={instructions?.scriptTag || ''}
                        readOnly
                        className="font-mono text-sm"
                        data-testid="input-script-tag"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyScript}
                        className="flex items-center gap-2"
                        data-testid="button-copy-script"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>

                  {/* Step-by-step instructions */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Manual Installation Steps:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      {instructions?.instructions?.map((step: string, index: number) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Alternative method */}
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      {instructions?.alternativeMethod?.description}
                    </h4>
                    <p className="text-sm text-blue-700">
                      {instructions?.alternativeMethod?.note}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Widget Preview</h3>
                <div className="bg-gray-100 p-8 rounded-lg relative min-h-[300px]">
                  <div className="text-center text-gray-500 mb-4">
                    Your storefront preview
                  </div>
                  
                  {/* Widget Preview */}
                  <div 
                    className={`absolute ${
                      settings.widgetPosition.includes('bottom') ? 'bottom-4' : 'top-4'
                    } ${
                      settings.widgetPosition.includes('right') ? 'right-4' : 'left-4'
                    }`}
                  >
                    <div className="flex flex-col items-end space-y-2">
                      {/* Chat button */}
                      <button
                        className="w-14 h-14 rounded-full shadow-lg text-white flex items-center justify-center transform transition-transform hover:scale-105"
                        style={{ backgroundColor: settings.widgetColor }}
                        data-testid="preview-chat-button"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-4">
                    Widget will appear in the <strong>{settings.widgetPosition}</strong> corner
                    on: {settings.enabledPages.join(', ')} pages
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}