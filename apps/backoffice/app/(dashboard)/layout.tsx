"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import api, { getContentStrategyBrief } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Globe,
  LogOut,
  Settings,
  Tag,
  FileText,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart2,
} from "lucide-react";
import React from "react";

interface Site {
  id: string;
  name: string;
  slug: string;
}

interface Brief {
  id: string;
  status: string;
}

function GlobalBriefAlert() {
  const { data: sites = [] } = useQuery<Site[]>({
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

  const allSettled = briefResults.every((r) => !r.isPending);
  if (!allSettled || sites.length === 0) return null;

  const missingSites = sites.filter((_, i) => briefResults[i].data === null);
  if (missingSites.length === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-sm text-amber-800 shrink-0">
      <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />
      <span className="flex-1">
        {missingSites.length === 1
          ? <><strong>{missingSites[0].name}</strong> is missing a Content Strategy Brief.</>
          : <><strong>{missingSites.length} of your websites</strong> are missing a Content Strategy Brief.</>
        }
        {" "}Let AI generate a content roadmap and draft posts automatically.
      </span>
      {missingSites.length === 1 ? (
        <Link
          href={`/sites/${missingSites[0].id}/content-strategy-brief`}
          className="shrink-0 rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 whitespace-nowrap"
        >
          Generate with AI
        </Link>
      ) : (
        <Link
          href="/dashboard"
          className="shrink-0 rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 whitespace-nowrap"
        >
          View websites
        </Link>
      )}
    </div>
  );
}

function SiteNavItem({ site }: { site: Site }) {
  const pathname = usePathname();
  const baseHref = `/sites/${site.id}`;
  const isActive = pathname.startsWith(baseHref);
  const [open, setOpen] = React.useState(isActive);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent",
          isActive && "bg-accent font-medium"
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <Globe className="w-4 h-4 shrink-0" />
          <span className="truncate">{site.name}</span>
        </span>
        {open ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-1 border-l pl-3">
          <NavLink href={`${baseHref}/settings`} icon={<Settings className="w-3 h-3" />}>
            Settings
          </NavLink>
          <NavLink href={`${baseHref}/categories`} icon={<Tag className="w-3 h-3" />}>
            Categories
          </NavLink>
          <NavLink href={`${baseHref}/posts`} icon={<FileText className="w-3 h-3" />}>
            Posts
          </NavLink>
          <NavLink href={`${baseHref}/content-strategy-brief`} icon={<Sparkles className="w-3 h-3" />}>
            Content Strategy Brief
          </NavLink>
          <NavLink href={`${baseHref}/analytics`} icon={<BarChart2 className="w-3 h-3" />}>
            Analytics
          </NavLink>
        </div>
      )}
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent",
        isActive && "bg-accent font-medium"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

function Sidebar() {
  const { logout } = useAuth();
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: () => api.get("/api/sites").then((r) => r.data),
  });

  return (
    <aside className="w-64 shrink-0 border-r bg-background flex flex-col h-full">
      <div className="p-4 flex items-center gap-2 font-semibold text-lg border-b">
        <LayoutDashboard className="w-5 h-5" />
        Blogs Tool
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <NavLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>
          Dashboard
        </NavLink>
        <Separator className="my-2" />
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Websites
        </p>
        {sites.map((site) => (
          <SiteNavItem key={site.id} site={site} />
        ))}
        <Link
          href="/sites/new"
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <PlusCircle className="w-4 h-4" />
          New website
        </Link>
      </nav>
      <div className="p-3 border-t">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={logout}>
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <GlobalBriefAlert />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6">{children}</main>
      </div>
    </div>
  );
}
