"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, CheckCircle2, XCircle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { getContentStrategyBrief, createContentStrategyBrief } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// ─── Zod schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  // Step 1
  company_name: z.string().min(1, "Required").max(200),
  product_description: z.string().min(1, "Required"),
  industry: z.string().min(1, "Required").max(100),
  // Step 2
  target_audience: z.string().min(1, "Required"),
  pain_points: z.string().min(1, "Required"),
  competitors: z.string().optional(),
  // Step 3
  differentiators: z.string().optional(),
  conversion_goal: z.string().optional(),
  content_goals: z.array(z.string()).optional(),
  // Step 4
  content_formats: z.array(z.string()).optional(),
  tone_of_voice: z.enum(["professional", "casual", "technical", "conversational"]),
});

type FormValues = z.infer<typeof schema>;

const CONTENT_GOAL_OPTIONS = [
  { value: "Brand Awareness", label: "Brand Awareness" },
  { value: "Lead Generation", label: "Lead Generation" },
  { value: "SEO", label: "SEO" },
  { value: "Customer Education", label: "Customer Education" },
];

const CONTENT_FORMAT_OPTIONS = [
  { value: "How-to Guides", label: "How-to Guides" },
  { value: "Listicles", label: "Listicles" },
  { value: "Comparisons", label: "Comparisons" },
  { value: "Case Studies", label: "Case Studies" },
  { value: "Thought Leadership", label: "Thought Leadership" },
];

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "technical", label: "Technical" },
  { value: "conversational", label: "Conversational" },
];

// ─── Step components ─────────────────────────────────────────────────────────

function Step1({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="company_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company Name *</FormLabel>
            <FormControl>
              <Input placeholder="Acme Corp" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="product_description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product / Service Description *</FormLabel>
            <FormControl>
              <Textarea rows={4} placeholder="Describe what your product does and who it's for…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="industry"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Industry *</FormLabel>
            <FormControl>
              <Input placeholder="e.g. B2B SaaS, E-commerce, FinTech…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function Step2({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="target_audience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Target Audience / ICP *</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="Describe your ideal customer profile…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="pain_points"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pain Points *</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="What problems does your audience face?" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="competitors"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Competitors (optional)</FormLabel>
            <FormControl>
              <Textarea rows={2} placeholder="List main competitors, one per line…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function Step3({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="differentiators"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Differentiators (optional)</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="What makes you different from competitors?" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="conversion_goal"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Conversion Goal (optional)</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Book a demo, Start free trial…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="content_goals"
        render={() => (
          <FormItem>
            <FormLabel>Content Goals</FormLabel>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {CONTENT_GOAL_OPTIONS.map((opt) => (
                <FormField
                  key={opt.value}
                  control={form.control}
                  name="content_goals"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={(field.value ?? []).includes(opt.value)}
                          onCheckedChange={(checked) => {
                            const current = field.value ?? [];
                            field.onChange(
                              checked ? [...current, opt.value] : current.filter((v) => v !== opt.value)
                            );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">{opt.label}</FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function Step4({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="content_formats"
        render={() => (
          <FormItem>
            <FormLabel>Preferred Content Formats</FormLabel>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {CONTENT_FORMAT_OPTIONS.map((opt) => (
                <FormField
                  key={opt.value}
                  control={form.control}
                  name="content_formats"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={(field.value ?? []).includes(opt.value)}
                          onCheckedChange={(checked) => {
                            const current = field.value ?? [];
                            field.onChange(
                              checked ? [...current, opt.value] : current.filter((v) => v !== opt.value)
                            );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">{opt.label}</FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="tone_of_voice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tone of Voice</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone…" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {TONE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoadmapTopic {
  title: string;
  angle: string;
  targetKeyword: string;
  contentFormat: string;
  priority: number;
  outline: string[];
}

interface Brief {
  id: string;
  status: string;
  errorMessage?: string | null;
  postsGenerated?: number;
  roadmapJson?: string | null;
  companyName?: string;
  productDescription?: string;
  industry?: string;
  targetAudience?: string;
  painPoints?: string;
  competitors?: string | null;
  differentiators?: string | null;
  conversionGoal?: string | null;
  contentGoals?: string | null;
  contentFormats?: string | null;
  toneOfVoice?: string;
  updatedAt?: string;
}

// ─── Run panel (right column) ─────────────────────────────────────────────────

function RunPanel({
  siteId,
  brief,
  onRegenerate,
  isGenerating,
}: {
  siteId: string;
  brief: Brief | null;
  onRegenerate: () => void;
  isGenerating: boolean;
}) {
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);

  const roadmap: RoadmapTopic[] = (() => {
    try {
      return JSON.parse(brief?.roadmapJson ?? "[]");
    } catch {
      return [];
    }
  })();

  const isRunning =
    brief?.status === "pending" ||
    brief?.status === "researching" ||
    brief?.status === "writing";

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: "Queued", className: "bg-amber-100 text-amber-800" },
    researching: { label: "Researching", className: "bg-blue-100 text-blue-800" },
    writing: { label: "Writing", className: "bg-blue-100 text-blue-800" },
    ready: { label: "Ready", className: "bg-green-100 text-green-800" },
    error: { label: "Failed", className: "bg-red-100 text-red-800" },
  };

  const progressSteps = [
    { key: "researching", label: "Researching content opportunities" },
    { key: "writing", label: "Writing draft posts" },
    { key: "ready", label: "Posts ready for review" },
  ];

  const statusOrder = ["pending", "researching", "writing", "ready"];
  const currentIdx = statusOrder.indexOf(brief?.status ?? "pending");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Runs</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={onRegenerate}
          disabled={isGenerating || isRunning}
          className="gap-2"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Re-generate
        </Button>
      </div>

      {!brief ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              Fill in the form and click <strong>Generate Content</strong> to
              start your first run.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Latest run</CardTitle>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  statusConfig[brief.status]?.className ?? ""
                }`}
              >
                {statusConfig[brief.status]?.label ?? brief.status}
              </span>
            </div>
            {brief.updatedAt && (
              <CardDescription>
                {new Date(brief.updatedAt).toLocaleString()}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isRunning && (
              <div className="space-y-3">
                {progressSteps.map((step, idx) => {
                  const stepIdx = idx + 1;
                  const done = currentIdx > stepIdx;
                  const active = currentIdx === stepIdx;
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                          done
                            ? "bg-green-500 text-white"
                            : active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {done ? "✓" : stepIdx}
                      </div>
                      <span
                        className={`text-sm ${
                          active ? "font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                        {active && (
                          <Loader2 className="inline ml-2 w-3 h-3 animate-spin" />
                        )}
                      </span>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground pt-1">
                  This may take a few minutes.
                </p>
              </div>
            )}

            {brief.status === "error" && (
              <div className="flex items-start gap-3 text-sm text-red-600">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{brief.errorMessage ?? "An unexpected error occurred."}</p>
              </div>
            )}

            {brief.status === "ready" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{brief.postsGenerated ?? 0} draft posts created</span>
                  <Link
                    href={`/sites/${siteId}/posts`}
                    className="ml-auto text-primary hover:underline font-medium whitespace-nowrap"
                  >
                    View posts →
                  </Link>
                </div>

                {roadmap.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Content Roadmap ({roadmap.length} topics)
                    </p>
                    {roadmap.map((topic, idx) => (
                      <div key={idx} className="border rounded-md overflow-hidden">
                        <button
                          type="button"
                          className="w-full flex items-start justify-between gap-2 p-3 text-left hover:bg-muted/50 transition-colors"
                          onClick={() =>
                            setExpandedTopic(expandedTopic === idx ? null : idx)
                          }
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">
                              {topic.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {topic.contentFormat} · {topic.targetKeyword}
                            </p>
                          </div>
                          {expandedTopic === idx ? (
                            <ChevronUp className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                          )}
                        </button>
                        {expandedTopic === idx && (
                          <div className="px-3 pb-3 border-t bg-muted/30 pt-2 space-y-1.5">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Angle:
                              </span>{" "}
                              {topic.angle}
                            </p>
                            {topic.outline?.length > 0 && (
                              <ul className="text-xs space-y-1 mt-1">
                                {topic.outline.map((point, i) => (
                                  <li key={i} className="flex gap-1.5">
                                    <span className="text-muted-foreground shrink-0">
                                      {i + 1}.
                                    </span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ContentStrategyBriefPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const queryClient = useQueryClient();
  const [initialized, setInitialized] = useState(false);

  const { data: brief, isLoading: briefLoading } = useQuery<Brief | null>({
    queryKey: ["content-strategy-brief", siteId],
    queryFn: () =>
      getContentStrategyBrief(siteId).catch((err) => {
        if (err?.response?.status === 404) return null;
        throw err;
      }),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (
        status === "pending" ||
        status === "researching" ||
        status === "writing"
      )
        return 3000;
      return false;
    },
    staleTime: 0,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      company_name: "",
      product_description: "",
      industry: "",
      target_audience: "",
      pain_points: "",
      competitors: "",
      differentiators: "",
      conversion_goal: "",
      content_goals: [],
      content_formats: [],
      tone_of_voice: "professional",
    },
  });

  // Pre-fill once from the server data
  useEffect(() => {
    if (initialized) return;
    if (brief === undefined) return;
    if (brief) {
      form.reset({
        company_name: brief.companyName ?? "",
        product_description: brief.productDescription ?? "",
        industry: brief.industry ?? "",
        target_audience: brief.targetAudience ?? "",
        pain_points: brief.painPoints ?? "",
        competitors: brief.competitors ?? "",
        differentiators: brief.differentiators ?? "",
        conversion_goal: brief.conversionGoal ?? "",
        content_goals: brief.contentGoals
          ? brief.contentGoals.split(",").filter(Boolean)
          : [],
        content_formats: brief.contentFormats
          ? brief.contentFormats.split(",").filter(Boolean)
          : [],
        tone_of_voice:
          (brief.toneOfVoice as FormValues["tone_of_voice"]) ?? "professional",
      });
    }
    setInitialized(true);
  }, [brief, initialized, form]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = {
        ...data,
        content_goals: (data.content_goals ?? []).join(","),
        content_formats: (data.content_formats ?? []).join(","),
      };
      return createContentStrategyBrief(siteId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-strategy-brief", siteId] });
    },
  });

  async function handleSubmit(values: FormValues) {
    mutation.mutate(values);
  }

  const isRunning =
    brief?.status === "pending" ||
    brief?.status === "researching" ||
    brief?.status === "writing";

  if (briefLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Content Strategy Brief
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tell us about your business and AI will generate a content roadmap and
          draft posts automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Form */}
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Company & Product
                  </p>
                  <Step1 form={form} />
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Your Audience
                  </p>
                  <Step2 form={form} />
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Goals & Positioning
                  </p>
                  <Step3 form={form} />
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Content Style
                  </p>
                  <Step4 form={form} />
                </div>

                {mutation.isError && (
                  <p className="text-sm text-red-600">
                    Something went wrong. Please try again.
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={mutation.isPending || isRunning}
                >
                  {mutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {brief ? "Re-generate Content" : "Generate Content"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Right: Runs */}
        {initialized && (
          <RunPanel
            siteId={siteId}
            brief={brief ?? null}
            onRegenerate={form.handleSubmit(handleSubmit)}
            isGenerating={mutation.isPending}
          />
        )}
      </div>
    </div>
  );
}


