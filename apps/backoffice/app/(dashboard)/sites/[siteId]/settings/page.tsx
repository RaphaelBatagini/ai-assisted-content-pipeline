"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import * as z from "zod";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPaletteSelect } from "@/components/ColorPaletteSelect";
import { SlugInput } from "@/components/SlugInput";
import { ImageUpload } from "@/components/ImageUpload";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Plus, Trash2 } from "lucide-react";
import { GoogleConnectCard } from "@/components/GoogleConnectCard";

const SOCIAL_PLATFORMS = [
  { value: "twitter", label: "Twitter / X" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "github", label: "GitHub" },
  { value: "pinterest", label: "Pinterest" },
];

const siteSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  contactEmail: z.string().email(),
  colorPalette: z.string().min(1),
  logoUrl: z.string().optional().default(""),
  faviconUrl: z.string().optional().default(""),
  whatsapp: z.string().optional().default(""),
  address: z.string().optional().default(""),
  fbPixelId: z.string().optional().default(""),
  customHeadScripts: z.string().optional().default(""),
});

type SiteForm = z.infer<typeof siteSchema>;

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

interface SiteData {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  colorPalette: string;
  logoUrl?: string;
  faviconUrl?: string;
  whatsapp?: string;
  address?: string;
  fbPixelId?: string;
  customHeadScripts?: string;
}

function SocialLinksSection({ siteId }: { siteId: string }) {
  const queryClient = useQueryClient();
  const [newPlatform, setNewPlatform] = useState("twitter");
  const [newUrl, setNewUrl] = useState("");

  const { data: links = [] } = useQuery<SocialLink[]>({
    queryKey: ["social-links", siteId],
    queryFn: () => api.get(`/api/sites/${siteId}/social-links`).then((r) => r.data),
  });

  async function handleAdd() {
    if (!newUrl) return;
    try {
      await api.post(`/api/sites/${siteId}/social-links`, { platform: newPlatform, url: newUrl });
      queryClient.invalidateQueries({ queryKey: ["social-links", siteId] });
      setNewUrl("");
      toast.success("Social link added");
    } catch {
      toast.error("Failed to add social link");
    }
  }

  async function handleDelete(linkId: string) {
    try {
      await api.delete(`/api/sites/${siteId}/social-links/${linkId}`);
      queryClient.invalidateQueries({ queryKey: ["social-links", siteId] });
      toast.success("Link removed");
    } catch {
      toast.error("Failed to remove link");
    }
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div key={link.id} className="flex items-center gap-2 p-2 rounded-md border">
          <span className="text-sm font-medium w-24 capitalize">{link.platform}</span>
          <span className="text-sm text-muted-foreground flex-1 truncate">{link.url}</span>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                <Trash2 className="w-3 h-3" />
              </Button>
            }
            title="Remove social link?"
            description="This will delete the social link permanently."
            confirmLabel="Remove"
            destructive
            onConfirm={() => handleDelete(link.id)}
          />
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <Select value={newPlatform} onValueChange={setNewPlatform}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOCIAL_PLATFORMS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="flex-1"
          placeholder="https://twitter.com/yourhandle"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
        />
        <Button type="button" onClick={handleAdd} size="icon" variant="outline">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function SiteSettingsPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const queryClient = useQueryClient();

  const { data: site } = useQuery<SiteData>({
    queryKey: ["site", siteId],
    queryFn: () => api.get(`/api/sites/${siteId}`).then((r) => r.data),
  });

  const form = useForm<SiteForm>({
    resolver: zodResolver(siteSchema) as Resolver<SiteForm>,
    defaultValues: {
      name: "",
      slug: "",
      contactEmail: "",
      colorPalette: "",
      logoUrl: "",
      faviconUrl: "",
      whatsapp: "",
      address: "",
      fbPixelId: "",
      customHeadScripts: "",
    },
  });

  useEffect(() => {
    if (site) {
      form.reset({
        name: site.name,
        slug: site.slug,
        contactEmail: site.contactEmail,
        colorPalette: site.colorPalette,
        logoUrl: site.logoUrl ?? "",
        faviconUrl: site.faviconUrl ?? "",
        whatsapp: site.whatsapp ?? "",
        address: site.address ?? "",
        fbPixelId: site.fbPixelId ?? "",
        customHeadScripts: site.customHeadScripts ?? "",
      });
    }
  }, [site, form]);

  const mutation = useMutation({
    mutationFn: (data: SiteForm) => api.put(`/api/sites/${siteId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site", siteId] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const watchName = form.watch("name");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Website settings</h1>
        {site && <p className="text-muted-foreground">{site.name}</p>}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="social">Social links</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4 space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <SlugInput value={field.value} onChange={field.onChange} watchValue={watchName} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="colorPalette"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color palette</FormLabel>
                        <FormControl>
                          <ColorPaletteSelect value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo</FormLabel>
                        <FormControl>
                          <ImageUpload value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="faviconUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Favicon</FormLabel>
                        <FormControl>
                          <ImageUpload value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <GoogleConnectCard />
                  <FormField
                    control={form.control}
                    name="fbPixelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook Pixel ID</FormLabel>
                        <FormControl>
                          <Input placeholder="000000000000000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customHeadScripts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom head scripts</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="<script>...</script>"
                            className="font-mono text-xs"
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Social links</CardTitle>
                </CardHeader>
                <CardContent>
                  <SocialLinksSection siteId={siteId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
