"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { getAnalyticsPosts } from "@/lib/api";
import type { AnalyticsPostRow } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Range = "7d" | "30d" | "90d";

function buildDateRange(range: Range): { startDate: string; endDate: string } {
  const end = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const start = subDays(end, days - 1);
  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatPercent(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(2)}%`;
}

const RANGE_OPTIONS: { label: string; value: Range }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

const PAGE_SIZE = 20;

export default function AnalyticsPostsPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [range, setRange] = useState<Range>("30d");
  const [page, setPage] = useState(1);
  const dateRange = buildDateRange(range);

  const { data, isLoading } = useQuery<{ rows: AnalyticsPostRow[]; page: number; limit: number }>({
    queryKey: ["analytics-posts", siteId, range, page],
    queryFn: () => getAnalyticsPosts(siteId, { ...dateRange, limit: PAGE_SIZE, page }),
    placeholderData: (prev) => prev,
  });

  const rows = data?.rows || [];
  const hasMore = rows.length === PAGE_SIZE;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/sites/${siteId}/analytics`}>← Back to overview</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Post performance</h1>
            <p className="text-muted-foreground text-sm">All posts ranked by pageviews.</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setRange(opt.value); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                range === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No post data available for this period. Metrics sync daily from Google Analytics.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="py-2 text-left font-semibold">#</th>
                      <th className="py-2 text-left font-semibold">Post</th>
                      <th className="py-2 text-right font-semibold">Pageviews</th>
                      <th className="py-2 text-right font-semibold">Sessions</th>
                      <th className="py-2 text-right font-semibold">Avg. duration</th>
                      <th className="py-2 text-right font-semibold">Bounce rate</th>
                      <th className="py-2 text-right font-semibold">CTA clicks</th>
                      <th className="py-2 text-right font-semibold">Conv. rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={row.postId} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-2 pr-2 text-muted-foreground tabular-nums">
                          {(page - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td className="py-2 max-w-xs">
                          <span className="line-clamp-1 font-medium">{row.title}</span>
                          <span className="text-xs text-muted-foreground">{row.slug}</span>
                        </td>
                        <td className="py-2 text-right tabular-nums">{row.pageviews.toLocaleString()}</td>
                        <td className="py-2 text-right tabular-nums">{row.sessions.toLocaleString()}</td>
                        <td className="py-2 text-right tabular-nums">{formatDuration(row.avgSessionDurationSeconds)}</td>
                        <td className="py-2 text-right tabular-nums">{formatPercent(row.bounceRate)}</td>
                        <td className="py-2 text-right tabular-nums">{row.ctaClicks}</td>
                        <td className="py-2 text-right">
                          <Badge variant="outline">{formatPercent(row.conversionRate)}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-muted-foreground">Page {page}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
