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
import { Store } from "@shared/schema";
import WidgetInstallation from "@/components/widget/widget-installation";

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

  // Get shop parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');

  const { data: store } = useQuery<Store>({
    queryKey: ['/api/stores/current', shop],
    queryFn: async () => {
      const url = shop 
        ? `/api/stores/current?shop=${encodeURIComponent(shop)}`
        : '/api/stores/current';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch store');
      }
      return response.json();
    }
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
                <TabsTrigger value="advanced" data-testid="tab-advanced">AI Automation</TabsTrigger>
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
                    <WidgetInstallation store={store} />
                  </TabsContent>

                  <TabsContent value="advanced">
                    <div className="space-y-6">
                      {/* AI Automation Features */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            AI Automation Features
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Smart Product Recommendations */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  Smart Product Recommendations
                                </h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                  AI suggests relevant products based on customer conversation context
                                </p>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Enable product suggestions</span>
                                    <Switch defaultChecked data-testid="switch-product-suggestions" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Max suggestions per conversation</span>
                                    <Input className="w-16" type="number" defaultValue="3" min="1" max="10" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Recommendation confidence threshold</span>
                                    <Select defaultValue="medium">
                                      <SelectTrigger className="w-28">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Low (70%)</SelectItem>
                                        <SelectItem value="medium">Medium (80%)</SelectItem>
                                        <SelectItem value="high">High (90%)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Intent Detection */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Intelligent Intent Detection
                                </h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                  Automatically detect customer intent and route conversations accordingly
                                </p>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Detect buying intent</span>
                                    <Switch defaultChecked data-testid="switch-buying-intent" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Support inquiry routing</span>
                                    <Switch defaultChecked data-testid="switch-support-routing" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Product browsing assistance</span>
                                    <Switch defaultChecked data-testid="switch-browsing-assistance" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Automated Actions */}
                          <div className="border-t pt-6">
                            <h4 className="font-medium mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              Automated Customer Actions
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-medium text-sm">Cart Recovery</h5>
                                  <Switch defaultChecked data-testid="switch-cart-recovery" />
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                  Send follow-up messages for abandoned carts
                                </p>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs">Follow-up delay</span>
                                    <Select defaultValue="30m">
                                      <SelectTrigger className="w-20 h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="15m">15min</SelectItem>
                                        <SelectItem value="30m">30min</SelectItem>
                                        <SelectItem value="1h">1hour</SelectItem>
                                        <SelectItem value="2h">2hours</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-medium text-sm">Auto-routing</h5>
                                  <Switch defaultChecked data-testid="switch-auto-routing" />
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                  Automatically guide customers to relevant pages
                                </p>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs">Route confidence</span>
                                    <Select defaultValue="high">
                                      <SelectTrigger className="w-20 h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-medium text-sm">Smart Upsells</h5>
                                  <Switch defaultChecked data-testid="switch-smart-upsells" />
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                  Suggest complementary products intelligently
                                </p>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs">Suggestion timing</span>
                                    <Select defaultValue="after-interest">
                                      <SelectTrigger className="w-20 h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="immediate">Immediate</SelectItem>
                                        <SelectItem value="after-interest">After Interest</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Analytics & Insights */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            AI Performance Monitoring
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-muted rounded-lg">
                              <div className="text-2xl font-bold text-green-600">94%</div>
                              <div className="text-sm text-muted-foreground">Intent Detection Accuracy</div>
                            </div>
                            <div className="text-center p-4 bg-muted rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">3.2</div>
                              <div className="text-sm text-muted-foreground">Avg Products Recommended</div>
                            </div>
                            <div className="text-center p-4 bg-muted rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">67%</div>
                              <div className="text-sm text-muted-foreground">Automation Success Rate</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Enable detailed AI analytics</span>
                            <Switch defaultChecked data-testid="switch-ai-analytics" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Advanced Settings */}
                      <Card>
                        <CardHeader>
                          <CardTitle>System Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                        </CardContent>
                      </Card>
                    </div>
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
