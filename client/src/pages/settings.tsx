import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ChatConfiguration } from "@/types";

const configSchema = z.object({
  zaiModel: z.enum(["glm-4.5-flash", "glm-4.5", "glm-4.5v"]),
  maxContextLength: z.number().min(1000).max(32000),
  chatWidgetPosition: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]),
  storeDataRestriction: z.boolean(),
  autoResponseEnabled: z.boolean().optional(),
  businessHours: z.object({
    enabled: z.boolean(),
    start: z.string(),
    end: z.string(),
    timezone: z.string()
  }).optional()
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: store } = useQuery({
    queryKey: ['/api/stores/current']
  });

  const { data: config, isLoading } = useQuery<ChatConfiguration>({
    queryKey: ['/api/config']
  });

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      zaiModel: "glm-4.5-flash",
      maxContextLength: 4000,
      chatWidgetPosition: "bottom-right",
      storeDataRestriction: true,
      autoResponseEnabled: true,
      businessHours: {
        enabled: false,
        start: "09:00",
        end: "17:00",
        timezone: "UTC"
      }
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: ConfigFormData) => {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your configuration has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/config'] });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ConfigFormData) => {
    updateConfigMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar store={store} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar store={store} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" data-testid="page-title">Settings</h2>
              <p className="text-muted-foreground">Configure your AI chat support system</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
                <TabsTrigger value="ai" data-testid="tab-ai">AI Configuration</TabsTrigger>
                <TabsTrigger value="chat" data-testid="tab-chat">Chat Widget</TabsTrigger>
                <TabsTrigger value="advanced" data-testid="tab-advanced">Advanced</TabsTrigger>
              </TabsList>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <TabsContent value="general">
                    <Card>
                      <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="storeDataRestriction"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Store Data Restriction</FormLabel>
                                <FormDescription>
                                  Limit AI responses to your store data only
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-store-data-restriction"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="autoResponseEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Auto Response</FormLabel>
                                <FormDescription>
                                  Automatically respond to customer inquiries
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-auto-response"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="ai">
                    <Card>
                      <CardHeader>
                        <CardTitle>AI Model Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="zaiModel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Z.AI Model</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-zai-model">
                                    <SelectValue placeholder="Select AI model" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="glm-4.5-flash">GLM-4.5-Flash (Free, Fast)</SelectItem>
                                  <SelectItem value="glm-4.5">GLM-4.5 (Advanced)</SelectItem>
                                  <SelectItem value="glm-4.5v">GLM-4.5V (Vision Support)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                GLM-4.5-Flash is recommended for production use (free with no limitations)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxContextLength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Context Length</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={1000} 
                                  max={32000} 
                                  step={100}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  data-testid="input-max-context-length"
                                />
                              </FormControl>
                              <FormDescription>
                                Maximum number of tokens for AI context (1000-32000)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="chat">
                    <Card>
                      <CardHeader>
                        <CardTitle>Chat Widget Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="chatWidgetPosition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Widget Position</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-widget-position">
                                    <SelectValue placeholder="Select position" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                  <SelectItem value="top-right">Top Right</SelectItem>
                                  <SelectItem value="top-left">Top Left</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Choose where the chat widget appears on your store
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4">
                          <h4 className="font-medium">Widget Preview</h4>
                          <div className="relative bg-muted rounded-lg p-8 h-64 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50"></div>
                            <div className="relative h-full">
                              <div 
                                className={`absolute w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform ${
                                  form.watch('chatWidgetPosition') === 'bottom-right' ? 'bottom-4 right-4' :
                                  form.watch('chatWidgetPosition') === 'bottom-left' ? 'bottom-4 left-4' :
                                  form.watch('chatWidgetPosition') === 'top-right' ? 'top-4 right-4' :
                                  'top-4 left-4'
                                }`}
                                data-testid="widget-preview"
                              >
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="advanced">
                    <Card>
                      <CardHeader>
                        <CardTitle>Advanced Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium mb-4">Performance</h4>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Response timeout</span>
                                <Input className="w-24" type="number" defaultValue="30" />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Max concurrent chats</span>
                                <Input className="w-24" type="number" defaultValue="100" />
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-4">Data Management</h4>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Chat history retention</span>
                                <Select defaultValue="90d">
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="30d">30 days</SelectItem>
                                    <SelectItem value="90d">90 days</SelectItem>
                                    <SelectItem value="1y">1 year</SelectItem>
                                    <SelectItem value="forever">Forever</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Auto-archive inactive chats</span>
                                <Switch defaultChecked />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-border">
                          <h4 className="font-medium mb-4 text-destructive">Danger Zone</h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                              <div>
                                <p className="font-medium">Reset All Chat Data</p>
                                <p className="text-sm text-muted-foreground">
                                  This will permanently delete all conversation history
                                </p>
                              </div>
                              <Button variant="destructive" size="sm" data-testid="button-reset-data">
                                Reset Data
                              </Button>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                              <div>
                                <p className="font-medium">Uninstall App</p>
                                <p className="text-sm text-muted-foreground">
                                  Remove the app from your store completely
                                </p>
                              </div>
                              <Button variant="destructive" size="sm" data-testid="button-uninstall">
                                Uninstall
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <div className="flex justify-end gap-3 pt-6">
                    <Button 
                      type="submit" 
                      disabled={updateConfigMutation.isPending}
                      data-testid="button-save-settings"
                    >
                      {updateConfigMutation.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </form>
              </Form>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
