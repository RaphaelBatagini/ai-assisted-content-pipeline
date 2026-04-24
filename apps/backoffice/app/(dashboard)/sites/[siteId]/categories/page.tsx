"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable, Column } from "@/components/DataTable";
import { SlugInput } from "@/components/SlugInput";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
});

type CategoryForm = z.infer<typeof categorySchema>;

function CategoryDialog({
  open,
  onClose,
  siteId,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  siteId: string;
  initial?: Category;
}) {
  const queryClient = useQueryClient();
  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: initial?.name ?? "", slug: initial?.slug ?? "" },
  });

  const watchName = form.watch("name");

  async function onSubmit(data: CategoryForm) {
    try {
      if (initial) {
        await api.put(`/api/sites/${siteId}/categories/${initial.id}`, data);
        toast.success("Category updated");
      } else {
        await api.post(`/api/sites/${siteId}/categories`, data);
        toast.success("Category created");
      }
      queryClient.invalidateQueries({ queryKey: ["categories", siteId] });
      onClose();
    } catch {
      toast.error("Failed to save category");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Technology" {...field} />
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoriesPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories", siteId],
    queryFn: () => api.get(`/api/sites/${siteId}/categories`).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/sites/${siteId}/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", siteId] });
      toast.success("Category deleted");
    },
    onError: () => toast.error("Failed to delete category"),
  });

  const columns: Column<Category>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "slug", label: "Slug", sortable: true },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setEditing(row);
              setDialogOpen(true);
            }}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                <Trash2 className="w-3 h-3" />
              </Button>
            }
            title="Delete category?"
            description="Posts in this category won't be deleted, but the category association will be removed."
            confirmLabel="Delete"
            destructive
            onConfirm={() => deleteMutation.mutate(row.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New category
        </Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse h-32 rounded-md border bg-muted" />
      ) : (
        <DataTable
          data={categories}
          columns={columns}
          filterKeys={["name", "slug"]}
          filterPlaceholder="Filter categories…"
          emptyMessage="No categories yet. Create one to get started."
        />
      )}

      <CategoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        siteId={siteId}
        initial={editing}
      />
    </div>
  );
}
