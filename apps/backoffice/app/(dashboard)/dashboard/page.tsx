"use client";

import Link from "next/link";
import { useQuery, useQueries } from "@tanstack/react-query";
import api, { getContentStrategyBrief } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Plus, ExternalLink, Sparkles, Loader2, AlertTriangle } from "lucide-react";

interface Site {
  id: string;
  name: string;
  slug: string;
  colorPalette: string;
}

interface Brief {
  id: string;
  status: string;
}

function BriefBadge({ brief, isPending }: { brief: Brief | null | undefined; isPending: boolean }) {
  if (isPending) return null;

  if (brief === null) {
    return (
      <Link
        href="#"
        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200"
      >
        <Sparkles className="w-3 h-3" />
        No AI brief
      </Link>
    );
  }

  if (brief?.status === "researching" || brief?.status === "writing" || brief?.status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        <Loader2 className="w-3 h-3 animate-spin" />
        Generating…
      </span>
    );
  }

  if (brief?.status === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        <AlertTriangle className="w-3 h-3" />
        Generation failed
      </span>
    );
  }

  return null;
}

export default function DashboardPage() {
  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: () => api.get("/api/sites").then((r) => r.data),
  });

  const briefResults = useQueries({
    queries: sites.map((site) => ({
      queryKey: ["content-strategy-brief", site.id],
      queryFn: (): Promise<Brief | null> =>
        getContentStrategyBrief(site.id).catch((err: { response?: { status?: number } }) => {
          if (err?.response?.status === 404) return null;
          throw err;
        }),
      retry: false,
    })),
  });

  const briefBySiteId = Object.fromEntries(
    sites.map((site, i) => [site.id, briefResults[i]])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Websites</h1>
          <p className="text-muted-foreground">Manage all your blog websites from here.</p>
        </div>
        <Button asChild>
          <Link href="/sites/new">
            <Plus className="w-4 h-4 mr-2" />
            New website
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      ) : sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Globe className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium">No websites yet</h2>
          <p className="text-muted-foreground mb-4">Create your first blog website to get started.</p>
          <Button asChild>
            <Link href="/sites/new">
              <Plus className="w-4 h-4 mr-2" />
              New website
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => {
            const briefQuery = briefBySiteId[site.id];
            const brief = briefQuery?.data;
            const briefPending = briefQuery?.isPending ?? true;
            const missingBrief = !briefPending && brief === null;

            return (
            <Card key={site.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                    <Link href={`/sites/${site.id}/settings`}>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </Button>
                </div>
                <CardTitle className="text-base">{site.name}</CardTitle>
                <CardDescription className="font-mono text-xs">/{site.slug}</CardDescription>
                <div className="pt-1">
                  <BriefBadge brief={brief} isPending={briefPending} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/sites/${site.id}/posts`}>Posts</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/sites/${site.id}/settings`}>Settings</Link>
                </Button>
                {missingBrief && (
                  <Button size="sm" variant="secondary" asChild className="gap-1">
                    <Link href={`/sites/${site.id}/content-strategy-brief`}>
                      <Sparkles className="w-3 h-3" />
                      Generate with AI
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
