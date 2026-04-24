"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
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
} from "lucide-react";
import React from "react";

interface Site {
  id: number;
  name: string;
  slug: string;
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
          Sites
        </p>
        {sites.map((site) => (
          <SiteNavItem key={site.id} site={site} />
        ))}
        <Link
          href="/sites/new"
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <PlusCircle className="w-4 h-4" />
          New site
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
      <main className="flex-1 overflow-y-auto bg-muted/20 p-6">{children}</main>
    </div>
  );
}
