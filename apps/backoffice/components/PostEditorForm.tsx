"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import * as z from "zod";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SlugInput } from "@/components/SlugInput";
import { ImageUpload } from "@/components/ImageUpload";
import { RichEditor } from "@/components/RichEditor";
import { Badge } from "@/components/ui/badge";
import { X, Save, Globe, Archive, Plus } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface PostData {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  status: string;
  Categories?: Category[];
}

const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  excerpt: z.string().default(""),
  content: z.string().min(1, "Content is required"),
  coverImageUrl: z.string().default(""),
  seoTitle: z.string().max(255).default(""),
  seoDescription: z.string().max(255).default(""),
  ogImageUrl: z.string().default(""),
  categoryIds: z.array(z.string()).default([]),
});

type PostForm = z.infer<typeof postSchema>;

export default function PostEditorPage({ postId }: { postId?: string }) {
  const { siteId } = useParams<{ siteId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!postId;

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories", siteId],
    queryFn: () => api.get(`/api/sites/${siteId}/categories`).then((r) => r.data),
  });

  const { data: post } = useQuery<PostData>({
    queryKey: ["post", siteId, postId],
    queryFn: () => api.get(`/api/sites/${siteId}/posts/${postId}`).then((r) => r.data),
    enabled: isEdit,
  });

  const form = useForm<PostForm>({
    resolver: zodResolver(postSchema) as Resolver<PostForm>,
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImageUrl: "",
      seoTitle: "",
      seoDescription: "",
      ogImageUrl: "",
      categoryIds: [],
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        content: post.content,
        coverImageUrl: post.coverImageUrl ?? "",
        seoTitle: post.seoTitle ?? "",
        seoDescription: post.seoDescription ?? "",
        ogImageUrl: post.ogImageUrl ?? "",
        categoryIds: (post.Categories ?? []).map((c) => c.id),
      });
    }
  }, [post, form]);

  async function savePost(data: PostForm, status: "draft" | "published" | "archived"): Promise<string> {
    if (isEdit) {
      await api.put(`/api/sites/${siteId}/posts/${postId}`, { ...data, status });
      return postId!;
    } else {
      const resp = await api.post(`/api/sites/${siteId}/posts`, { ...data, status });
      return resp.data.id;
    }
  }

  async function handleSaveDraft() {
    const valid = await form.trigger();
    if (!valid) return;
    try {
      const newPostId = await savePost(form.getValues(), "draft");
      queryClient.invalidateQueries({ queryKey: ["posts", siteId] });
      toast.success("Draft saved");
      if (!isEdit) router.push(`/sites/${siteId}/posts/${newPostId}/edit`);
    } catch {
      toast.error("Failed to save draft");
    }
  }

  async function handlePublish() {
    const valid = await form.trigger();
    if (!valid) return;
    try {
      const newPostId = await savePost(form.getValues(), "published");
      await api.put(`/api/sites/${siteId}/posts/${newPostId}/publish`);
      queryClient.invalidateQueries({ queryKey: ["posts", siteId] });
      toast.success("Post published!");
      router.push(`/sites/${siteId}/posts`);
    } catch {
      toast.error("Failed to publish post");
    }
  }

  async function handleArchive() {
    if (!isEdit) return;
    const valid = await form.trigger();
    if (!valid) return;
    try {
      await savePost(form.getValues(), "archived");
      await api.put(`/api/sites/${siteId}/posts/${postId}/archive`);
      queryClient.invalidateQueries({ queryKey: ["posts", siteId] });
      toast.success("Post archived");
      router.push(`/sites/${siteId}/posts`);
    } catch {
      toast.error("Failed to archive post");
    }
  }

  const watchTitle = form.watch("title");
  const watchCategoryIds = form.watch("categoryIds");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setCreatingCategory(true);
    try {
      const resp = await api.post(`/api/sites/${siteId}/categories`, { name });
      queryClient.invalidateQueries({ queryKey: ["categories", siteId] });
      form.setValue("categoryIds", [...form.getValues("categoryIds"), resp.data.id]);
      setNewCategoryName("");
      toast.success(`Category "${name}" created`);
    } catch {
      toast.error("Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  }

  function toggleCategory(id: string) {
    const current = form.getValues("categoryIds");
    if (current.includes(id)) {
      form.setValue("categoryIds", current.filter((c) => c !== id));
    } else {
      form.setValue("categoryIds", [...current, id]);
    }
  }

  return (
    <Form {...form}>
      <form className="flex flex-col h-full gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{isEdit ? "Edit post" : "New post"}</h1>
            {isEdit && post && (
              <Badge
                variant={
                  post.status === "published"
                    ? "default"
                    : post.status === "archived"
                    ? "secondary"
                    : "outline"
                }
                className="capitalize"
              >
                {post.status}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={form.formState.isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              Save draft
            </Button>
            {isEdit && (
              <Button type="button" variant="outline" onClick={handleArchive} disabled={form.formState.isSubmitting}>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
            )}
            <Button type="button" onClick={handlePublish} disabled={form.formState.isSubmitting}>
              <Globe className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        <div className="flex gap-6 flex-1">
          {/* Main content */}
          <div className="flex-1 space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Post title"
                      className="text-2xl font-bold border-0 border-b rounded-none px-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/50"
                      {...field}
                    />
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
                    <SlugInput value={field.value} onChange={field.onChange} watchValue={watchTitle} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <RichEditor value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Sidebar */}
          <div className="w-72 shrink-0 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Excerpt</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Short summary of this post…"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Cover image</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUpload value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No categories yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className="focus:outline-none"
                      >
                        <Badge
                          variant={watchCategoryIds.includes(cat.id) ? "default" : "outline"}
                          className="cursor-pointer"
                        >
                          {cat.name}
                          {watchCategoryIds.includes(cat.id) && (
                            <X className="w-2.5 h-2.5 ml-1" />
                          )}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  <Input
                    placeholder="New category…"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                    }}
                    className="h-7 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2"
                    disabled={!newCategoryName.trim() || creatingCategory}
                    onClick={handleCreateCategory}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormField
                  control={form.control}
                  name="seoTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">SEO title</FormLabel>
                      <FormControl>
                        <Input placeholder="Override title for search engines" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="seoDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Meta description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="160 char description"
                          rows={2}
                          maxLength={160}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ogImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">OG image</FormLabel>
                      <FormControl>
                        <ImageUpload value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
