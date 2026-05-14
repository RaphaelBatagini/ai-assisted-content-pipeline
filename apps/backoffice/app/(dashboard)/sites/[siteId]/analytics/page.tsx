"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { getAnalyticsOverview } from "@/lib/api";
import type { AnalyticsOverview } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, BarChart2, MousePointerClick, Users, Clock, TrendingUp, FileText } from "lucide-react";

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
  return `${(rate * 100).toFixed(1)}%`;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function NoGaPrompt({ siteId }: { siteId: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <AlertCircle className="w-10 h-10 text-amber-500" />
      <div>
        <p className="font-semibold text-lg">Google Analytics not configured</p>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
          Add your GA4 Property ID in the site settings to start collecting metrics.
          Daily sync runs automatically at 3 AM UTC.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href={`/sites/${siteId}/settings`}>Go to Settings</Link>
      </Button>
    </div>
  );
}

const RANGE_OPTIONS: { label: string; value: Range }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

const CHART_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6"];

export default function AnalyticsDashboardPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [range, setRange] = useState<Range>("30d");
  const dateRange = buildDateRange(range);

  const { data, isLoading, isError } = useQuery<AnalyticsOverview>({
    queryKey: ["analytics-overview", siteId, range],
    queryFn: () => getAnalyticsOverview(siteId, dateRange),
    retry: false,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm">Performance metrics synced daily from Google Analytics.</p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
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

      {isLoading && (
        <div className="py-20 text-center text-muted-foreground text-sm">Loading metrics…</div>
      )}

      {isError && (
        <div className="py-16 text-center text-destructive text-sm">Failed to load analytics data.</div>
      )}

      {data && !data.gaConfigured && <NoGaPrompt siteId={siteId} />}

      {data && data.gaConfigured && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <KpiCard title="Sessions" value={data.totals.sessions.toLocaleString()} icon={BarChart2} />
            <KpiCard title="Users" value={data.totals.users.toLocaleString()} icon={Users} />
            <KpiCard
              title="New Users"
              value={data.totals.newUsers.toLocaleString()}
              icon={TrendingUp}
              sub={data.totals.users > 0 ? `${((data.totals.newUsers / data.totals.users) * 100).toFixed(0)}% of users` : undefined}
            />
            <KpiCard title="CTA Clicks" value={data.totals.totalCtaClicks.toLocaleString()} icon={MousePointerClick} />
            <KpiCard
              title="Avg. Session"
              value={formatDuration(data.totals.avgSessionDurationSeconds)}
              icon={Clock}
            />
            <KpiCard
              title="Bounce Rate"
              value={formatPercent(data.totals.bounceRate)}
              icon={BarChart2}
            />
          </div>

          {/* Second row: editorial velocity */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Posts published</p>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{data.editorialVelocity}</p>
                <p className="text-xs text-muted-foreground mt-1">in selected period</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Organic sessions</p>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {data.visitsTrend
                    .reduce((acc) => acc, 0)
                    .toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">from search engines</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Conversion rate</p>
                  <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  {data.totals.sessions > 0
                    ? `${((data.totals.totalCtaClicks / data.totals.sessions) * 100).toFixed(2)}%`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">CTA clicks / sessions</p>
              </CardContent>
            </Card>
          </div>

          {/* Sessions over time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sessions over time</CardTitle>
            </CardHeader>
            <CardContent>
              {data.visitsTrend.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No data available for this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.visitsTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => format(new Date(v), "MMM d")}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(v) => format(new Date(v), "MMMM d, yyyy")}
                      formatter={(v) => [(v as number | undefined)?.toLocaleString() ?? "0", "Sessions"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Two column: new vs returning + top categories */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* New vs Returning */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">New vs. Returning users</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                {data.newVsReturning.newUsers + data.newVsReturning.returningUsers === 0 ? (
                  <p className="text-sm text-muted-foreground py-8">No data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "New", value: data.newVsReturning.newUsers },
                          { name: "Returning", value: data.newVsReturning.returningUsers },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        <Cell fill="#6366f1" />
                        <Cell fill="#e2e8f0" />
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(v) => (v as number | undefined)?.toLocaleString() ?? "0"} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 5 categories by views</CardTitle>
              </CardHeader>
              <CardContent>
                {data.topCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      layout="vertical"
                      data={data.topCategories}
                      margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                      <Tooltip formatter={(v) => [(v as number | undefined)?.toLocaleString() ?? "0", "Pageviews"]} />
                      <Bar dataKey="pageviews" radius={[0, 4, 4, 0]}>
                        {data.topCategories.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top 10 posts by views */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Top 10 posts by views</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/sites/${siteId}/analytics/posts`}>See all →</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.topPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data available for this period.</p>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-[1fr_80px_80px_90px] gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span>Post</span>
                    <span className="text-right">Views</span>
                    <span className="text-right">CTA clicks</span>
                    <span className="text-right">Conv. rate</span>
                  </div>
                  {data.topPosts.slice(0, 10).map((post, i) => (
                    <div
                      key={post.postId}
                      className="grid grid-cols-[1fr_80px_80px_90px] gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted/50 items-center"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                        <span className="truncate">{post.title}</span>
                      </span>
                      <span className="text-right tabular-nums">{post.pageviews.toLocaleString()}</span>
                      <span className="text-right tabular-nums">{post.ctaClicks}</span>
                      <span className="text-right tabular-nums">
                        <Badge variant="outline">{formatPercent(post.conversionRate)}</Badge>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top 5 posts by conversion */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Top 5 posts by conversion rate</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/sites/${siteId}/analytics/posts`}>See all →</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.topPostsByConversion.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Not enough data yet (requires ≥ 10 pageviews per post).
                </p>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-[1fr_80px_80px_90px] gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span>Post</span>
                    <span className="text-right">Views</span>
                    <span className="text-right">CTA clicks</span>
                    <span className="text-right">Conv. rate</span>
                  </div>
                  {data.topPostsByConversion.map((post, i) => (
                    <div
                      key={post.postId}
                      className="grid grid-cols-[1fr_80px_80px_90px] gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted/50 items-center"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                        <span className="truncate">{post.title}</span>
                      </span>
                      <span className="text-right tabular-nums">{post.pageviews.toLocaleString()}</span>
                      <span className="text-right tabular-nums">{post.ctaClicks}</span>
                      <span className="text-right tabular-nums">
                        <Badge className="bg-emerald-100 text-emerald-800 border-0">
                          {formatPercent(post.conversionRate)}
                        </Badge>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
