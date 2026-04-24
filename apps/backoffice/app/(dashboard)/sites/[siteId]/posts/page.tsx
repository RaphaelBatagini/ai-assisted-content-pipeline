"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/DataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";

type PostStatus = "draft" | "published" | "archived";

interface Post {
  id: string;
  title: string;
  status: PostStatus;
  publishedAt: string | null;
  readingTimeMinutes: number;
}

const STATUS_VARIANTS: Record<PostStatus, "draft" | "published" | "archived"> = {
  draft: "draft",
  published: "published",
  archived: "archived",
};

export default function PostsPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["posts", siteId],
    queryFn: () => api.get(`/api/sites/${siteId}/posts`).then((r) => r.data),
  });

  const filtered = statusFilter === "all" ? posts : posts.filter((p) => p.status === statusFilter);

  const columns: Column<Post>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (row) => (
        <span className="font-medium line-clamp-1">{row.title || <em className="text-muted-foreground">Untitled</em>}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status]}>{row.status}</Badge>
      ),
    },
    {
      key: "publishedAt",
      label: "Published",
      render: (row) =>
        row.publishedAt ? (
          <span className="text-sm">{format(new Date(row.publishedAt), "MMM d, yyyy")}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      key: "readingTimeMinutes",
      label: "Read time",
      render: (row) => (
        <span className="text-sm text-muted-foreground">{row.readingTimeMinutes} min</span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={`/sites/${siteId}/posts/${row.id}/edit`}>
            <Pencil className="w-3 h-3" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Button asChild>
          <Link href={`/sites/${siteId}/posts/new`}>
            <Plus className="w-4 h-4 mr-2" />
            New post
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as PostStatus | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="animate-pulse h-40 rounded-md border bg-muted" />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          filterKeys={["title"]}
          filterPlaceholder="Filter posts…"
          emptyMessage="No posts yet. Write your first post!"
        />
      )}
    </div>
  );
}
