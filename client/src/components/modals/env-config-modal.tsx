import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const configSchema = z.object({
  zaiApiKey: z.string().min(1, "Z.AI API key is required"),
  zaiModel: z.enum(["glm-4.5-flash", "glm-4.5", "glm-4.5v"]),
  chatWidgetPosition: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]),
  maxContextLength: z.number().min(1000).max(32000),
  storeDataRestriction: z.boolean(),
  // Chat widget customization
  chatWidgetColor: z.string().optional(),
  chatWidgetIcon: z.string().optional(),
  enabledPages: z.array(z.enum(["home", "product", "collection", "page", "blog"])).optional()
});

type ConfigFormData = z.infer<typeof configSchema>;

interface EnvConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnvConfigModal({ isOpen, onClose }: EnvConfigModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      zaiModel: "glm-4.5-flash",
      chatWidgetPosition: "bottom-right",
      maxContextLength: 4000,
      storeDataRestriction: true,
      chatWidgetColor: "#3B82F6",
      chatWidgetIcon: "chat",
      enabledPages: ["home", "product"]
    }
  });

  const onSubmit = async (data: ConfigFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      toast({
        title: "Configuration saved",
        description: "Your environment configuration has been updated successfully.",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="env-config-modal">
        <DialogHeader>
          <DialogTitle>Environment Configuration</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Z.AI Configuration */}
            <div>
              <h4 className="font-medium mb-4">Z.AI Configuration</h4>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="zaiApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Z.AI API Key</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your Z.AI API key" 
                          {...field}
                          data-testid="input-zai-api-key"
                        />
                      </FormControl>
                      <FormDescription>
                        Get your API key from{" "}
                        <a 
                          href="https://z.ai/manage-apikey/apikey-list" 
                          className="text-accent hover:underline" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          Z.AI Platform
                        </a>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zaiModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Selection</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-zai-model">
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="glm-4.5-flash">GLM-4.5-Flash (Free)</SelectItem>
                          <SelectItem value="glm-4.5">GLM-4.5</SelectItem>
                          <SelectItem value="glm-4.5v">GLM-4.5V (Vision)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>


            {/* Chat Widget Customization */}
            <div>
              <h4 className="font-medium mb-4">Chat Widget Customization</h4>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="chatWidgetColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Widget Primary Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input 
                            type="color" 
                            className="w-16 h-10 p-1 rounded"
                            {...field}
                            data-testid="input-widget-color"
                          />
                          <Input 
                            placeholder="#3B82F6" 
                            {...field}
                            data-testid="input-widget-color-text"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Choose the primary color for your chat widget
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enabledPages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Show Chat Widget On</FormLabel>
                      <FormDescription>
                        Select which pages should display the chat widget
                      </FormDescription>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          { value: "home", label: "Home Page" },
                          { value: "product", label: "Product Pages" },
                          { value: "collection", label: "Collection Pages" },
                          { value: "page", label: "Content Pages" },
                          { value: "blog", label: "Blog Pages" }
                        ].map((page) => (
                          <div key={page.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={page.value}
                              checked={field.value?.includes(page.value as any)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, page.value]);
                                } else {
                                  field.onChange(current.filter((v: string) => v !== page.value));
                                }
                              }}
                              data-testid={`checkbox-page-${page.value}`}
                            />
                            <label htmlFor={page.value} className="text-sm">
                              {page.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* App Settings */}
            <div>
              <h4 className="font-medium mb-4">App Settings</h4>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="chatWidgetPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chat Widget Position</FormLabel>
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
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-max-context-length"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum tokens for AI context
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storeDataRestriction"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-store-data-restriction"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable Store Data Restriction</FormLabel>
                        <FormDescription>
                          When enabled, AI responses are limited to your store data only
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                data-testid="button-save-config"
              >
                {isLoading ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
