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
  shopifyApiKey: z.string().min(1, "Shopify API key is required"),
  shopifyApiSecret: z.string().min(1, "Shopify API secret is required"),
  chatWidgetPosition: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]),
  maxContextLength: z.number().min(1000).max(32000),
  storeDataRestriction: z.boolean()
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
      storeDataRestriction: true
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


            {/* Shopify Configuration */}
            <div>
              <h4 className="font-medium mb-4">Shopify Configuration</h4>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="shopifyApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shopify API Key</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your Shopify app API key" 
                          {...field}
                          data-testid="input-shopify-api-key"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shopifyApiSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shopify API Secret</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your Shopify app secret" 
                          {...field}
                          data-testid="input-shopify-api-secret"
                        />
                      </FormControl>
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
