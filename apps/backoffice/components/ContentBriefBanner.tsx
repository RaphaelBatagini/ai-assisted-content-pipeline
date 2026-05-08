"use client";

import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";

interface Brief {
  id: string;
  status: string;
  errorMessage?: string | null;
  postsGenerated?: number;
}

interface ContentBriefBannerProps {
  siteId: string;
  brief: Brief | null;
}

export function ContentBriefBanner({ siteId, brief }: ContentBriefBannerProps) {
  if (brief === null) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 mb-4 text-sm text-yellow-800">
        <span className="flex-1">
          <strong>Missing Content Strategy Brief.</strong> Your website needs a Content Strategy Brief to fuel
          your growth engine.
        </span>
        <Link
          href={`/sites/${siteId}/content-strategy-brief`}
          className="shrink-0 rounded-md bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-700 inline-flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          Generate with AI
        </Link>
      </div>
    );
  }

  if (brief.status === "researching") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 mb-4 text-sm text-blue-800">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <span>Researching your industry and content opportunities…</span>
      </div>
    );
  }

  if (brief.status === "writing") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 mb-4 text-sm text-blue-800">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <span>
          Writing your posts… ({brief.postsGenerated ?? 0} done so far)
        </span>
      </div>
    );
  }

  if (brief.status === "error") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 mb-4 text-sm text-red-800">
        <span>
          <strong>Content generation failed.</strong>{" "}
          {brief.errorMessage ?? "An unexpected error occurred. Please try again."}
        </span>
      </div>
    );
  }

  // status === 'ready' or 'pending': no banner
  return null;
}
