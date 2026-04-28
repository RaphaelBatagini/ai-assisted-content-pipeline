"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getContentStrategyBrief } from "@/lib/api";
import { ContentBriefBanner } from "@/components/ContentBriefBanner";

interface Brief {
  id: string;
  status: string;
  errorMessage?: string | null;
  postsGenerated?: number;
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { siteId } = useParams<{ siteId: string }>();

  const { data: brief } = useQuery<Brief>({
    queryKey: ["content-strategy-brief", siteId],
    queryFn: () =>
      getContentStrategyBrief(siteId).catch((err: { response?: { status?: number } }) => {
        if (err?.response?.status === 404) return null;
        throw err;
      }),
    retry: false,
    // Poll while job is running
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "researching" || status === "writing") return 3000;
      return false;
    },
  });

  return (
    <div>
      {/* Only show site-level banner for in-progress / error states.
          The global alert in DashboardLayout handles the "missing brief" case. */}
      {brief && brief.status !== "ready" && (
        <ContentBriefBanner siteId={siteId} brief={brief} />
      )}
      {children}
    </div>
  );
}
