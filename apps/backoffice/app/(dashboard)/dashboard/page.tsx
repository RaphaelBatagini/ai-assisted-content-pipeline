"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Plus, ExternalLink } from "lucide-react";

interface Site {
  id: string;
  name: string;
  slug: string;
  colorPalette: string;
}

export default function DashboardPage() {
  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: () => api.get("/api/sites").then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Sites</h1>
          <p className="text-muted-foreground">Manage all your blog sites from here.</p>
        </div>
        <Button asChild>
          <Link href="/sites/new">
            <Plus className="w-4 h-4 mr-2" />
            New site
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
          <h2 className="text-lg font-medium">No sites yet</h2>
          <p className="text-muted-foreground mb-4">Create your first blog site to get started.</p>
          <Button asChild>
            <Link href="/sites/new">
              <Plus className="w-4 h-4 mr-2" />
              New site
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
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
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/sites/${site.id}/posts`}>Posts</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/sites/${site.id}/settings`}>Settings</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
