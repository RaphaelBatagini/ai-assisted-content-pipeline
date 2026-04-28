import type { Metadata } from "next";
import Link from "next/link";
import {
  Zap,
  Globe,
  BarChart3,
  Users,
  RefreshCw,
  Tag,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  Search,
  FileText,
  Settings,
  Activity,
  Lightbulb,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Platform for Agencies | Create Sites and Automated Content",
  description:
    "Automate sites, blogs and SEO for your clients. White-label platform for agencies to scale with recurring revenue.",
  keywords: [
    "marketing automation for agencies",
    "AI content generation",
    "SaaS for agencies",
    "white label digital marketing",
    "AI website creation",
    "automated SEO",
    "automatic blog",
    "automated client content",
    "agency scaling tool",
    "agency recurring revenue",
  ],
};

export default function RootPage() {
  return (
    <div className="h-screen overflow-y-auto bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">AgencyAI</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Get started for free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-background py-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-purple/30 bg-brand-purple/10 px-3 py-1 text-xs font-medium text-brand-purple mb-6">
            <Zap className="h-3 w-3" />
            AI marketing automation for agencies
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl mb-6">
            Create sites and content with AI —{" "}
            <span className="text-primary">
              and turn it into recurring revenue
            </span>{" "}
            for your agency
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automate the creation of blogs, posts and SEO strategies for your
            clients — while scaling your revenue with a white-label SaaS model.
          </p>
          <ul className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 text-sm text-muted-foreground mb-10">
            {[
              "Generate complete websites in minutes",
              "Produce SEO-optimized content automatically",
              "Manage multiple clients in one place",
              "Resell with your own brand",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Get started for free now
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-md border px-8 py-3 text-base font-semibold hover:bg-muted transition-colors"
            >
              See demo
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-muted/40 py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            Agencies waste time and money on tasks that don’t scale
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            Meanwhile, clients want consistent results — without paying more
            for it.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              "Manual content creation consumes hours per week",
              "Inconsistent blogs that don't generate traffic",
              "Difficulty proving ROI to clients",
              "Low predictability of monthly revenue",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-lg border bg-background p-4"
              >
                <span className="mt-0.5 h-5 w-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold shrink-0">
                  ✕
                </span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="bg-background py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            A platform that transforms content into{" "}
            <span className="text-primary">predictable growth</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Our platform uses AI to automate your agency’s entire content
            operation — from creation to continuous optimization.
          </p>
          <p className="text-muted-foreground text-lg mt-2">
            You deliver more value, with less effort.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-muted/40 py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-3">
            Automated SEO in 5 simple steps
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            From site creation to continuous optimization — all without needing
            technical knowledge.
          </p>
          <div className="relative">
            <div className="absolute left-5 top-6 bottom-6 w-px bg-border hidden sm:block" />
            <ol className="space-y-6">
              {[
                {
                  icon: Globe,
                  title: "Create the client’s site in minutes",
                  desc: "AI generates structure, layout and base content from your client’s brief.",
                },
                {
                  icon: Settings,
                  title: "Define the tone of voice",
                  desc: "Based on existing content or brief — the content always sounds like the client’s brand.",
                },
                {
                  icon: FileText,
                  title: "Automate content",
                  desc: "Posts are generated and published automatically, following an intelligent editorial calendar.",
                },
                {
                  icon: Activity,
                  title: "Track performance",
                  desc: "SEO and conversion data in real time, organized by client, in a single dashboard.",
                },
                {
                  icon: Lightbulb,
                  title: "Optimize with AI",
                  desc: "Automatic suggestions to improve ranking, engagement and conversion rate.",
                },
              ].map((step, i) => (
                <li
                  key={step.title}
                  className="relative flex items-start gap-5 sm:pl-14"
                >
                  <div className="absolute left-0 hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white sm:flex">
                    {i + 1}
                  </div>
                  <div className="flex-1 rounded-lg border bg-background p-5">
                    <div className="mb-1 flex items-center gap-3">
                      <step.icon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-background py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-3">
            Built for agencies that want to scale
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            All the tools your agency needs to grow without expanding the team.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Users,
                title: "Scale without expanding the team",
                desc: "Serve more clients without growing your operation. Automate repetitive work.",
              },
              {
                icon: TrendingUp,
                title: "Predictable recurring revenue",
                desc: "Turn one-time services into monthly subscriptions with cash flow predictability.",
              },
              {
                icon: Tag,
                title: "Full white-label",
                desc: "Sell as if it were your own product — your brand, your prices, your clients.",
              },
              {
                icon: Search,
                title: "Real SEO",
                desc: "Structured and optimized content to rank on Google from the first post.",
              },
              {
                icon: Clock,
                title: "Less operations, more strategy",
                desc: "Automate the operational and free your team for high-value work.",
              },
              {
                icon: BarChart3,
                title: "Real-time data",
                desc: "Track performance for all clients in a unified and intuitive dashboard.",
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-lg border bg-background p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* White-label */}
      <section className="bg-foreground py-20 px-4 text-background">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-purple/50 bg-brand-purple/20 px-3 py-1 text-xs font-medium text-white">
            <Tag className="h-3 w-3" />
            White-label digital marketing
          </div>
          <h2 className="mb-4 text-3xl font-bold">
            Your own SaaS, without needing to develop anything
          </h2>
          <p className="mb-8 text-lg text-background/80">
            Offer the platform with your brand, your prices and for your
            clients. Transform your agency into a technology company — without
            investing in development.
          </p>
          <div className="mb-10 grid sm:grid-cols-3 gap-4">
            {[
              { label: "Your brand", desc: "Logo, colors and own domain" },
              { label: "Your prices", desc: "Set margins however you want" },
              { label: "Your clients", desc: "100% your relationship" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-background/20 bg-background/10 p-4"
              >
                <div className="mb-1 font-semibold">{item.label}</div>
                <div className="text-sm text-background/70">{item.desc}</div>
              </div>
            ))}
          </div>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-background px-8 py-3 text-base font-semibold text-foreground hover:bg-background/90 transition-colors"
          >
            I want my own SaaS
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-muted/40 py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-3">
            Results that speak for themselves
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Agencies that automated their content operation with AI.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                metric: "+300%",
                label: "Increase in organic traffic",
                sub: "in 6 months of use",
              },
              {
                metric: "-70%",
                label: "Time spent on content",
                sub: "freed up for strategy",
              },
              {
                metric: "+2x",
                label: "Client retention",
                sub: "with consistent deliveries",
              },
            ].map((stat) => (
              <div
                key={stat.metric}
                className="rounded-lg border bg-background p-8 text-center"
              >
                <div className="mb-2 text-5xl font-extrabold text-primary">
                  {stat.metric}
                </div>
                <div className="mb-1 font-semibold">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans / Monetization */}
      <section className="bg-background py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-3">
            Monetize however you want
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            You have total flexibility to use, charge or resell the platform in
            whatever way makes most sense for your business.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                title: "Internal use",
                desc: "Use for all your clients and reduce the cost and time of content operations.",
                cta: "Get started now",
                highlight: false,
              },
              {
                title: "Charge a monthly fee",
                desc: "Add the platform to your service package and generate predictable recurring revenue.",
                cta: "I want recurring revenue",
                highlight: true,
              },
              {
                title: "Sell as SaaS",
                desc: "Launch your own white-label SaaS product and create a new line of business.",
                cta: "Create my SaaS",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.title}
                className={`flex flex-col rounded-lg border p-6 ${
                  plan.highlight ? "border-brand-purple/30 bg-brand-purple/5" : "bg-background"
                }`}
              >
                {plan.highlight && (
                  <span className="mb-3 inline-flex w-fit items-center rounded-full bg-brand-purple px-2.5 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="mb-2 text-lg font-bold">{plan.title}</h3>
                <p className="mb-4 flex-1 text-sm text-muted-foreground">
                  {plan.desc}
                </p>
                <Link
                  href="/register"
                  className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-brand-purple text-white hover:bg-brand-purple/90"
                      : "border hover:bg-muted"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40 py-20 px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-3">
            Frequently asked questions about the agency scaling tool
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Get your questions answered before getting started.
          </p>
          <div className="space-y-3">
            {[
              {
                q: "Does this replace writers?",
                a: "Not necessarily. The platform automates the generation of drafts and SEO-optimized posts, but your team can review and adjust each piece. You decide the level of automation — from 100% automatic to human-assisted.",
              },
              {
                q: "Does it work for any niche?",
                a: "Yes. The AI adapts content to the client's segment — health, technology, retail, services, education and much more. You configure the tone of voice and the platform learns each client's style.",
              },
              {
                q: "Can I use it with my current clients?",
                a: "Absolutely. You can migrate existing clients to the platform, create sites and start generating content automatically. There's no need to change your current methodology.",
              },
              {
                q: "Do I need to know SEO to use it?",
                a: "No. The platform handles all the technical SEO automatically — URL structure, meta tags, keyword density and internal links. You receive content ready to rank.",
              },
              {
                q: "How does white-label work?",
                a: "You customize the platform with your brand: logo, colors, domain and emails. Your clients access a solution with your agency's identity. You set the prices and maintain 100% of the client relationship.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-lg border bg-background"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-medium">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="border-t px-5 pb-5 pt-4 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary py-24 px-4 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-4xl font-extrabold">
            Start scaling your agency today
          </h2>
          <p className="mb-10 text-xl text-white/80">
            No complexity. No extra team. Just growth.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-white px-10 py-4 text-base font-bold text-primary hover:bg-white/90 transition-colors"
          >
            Get started now
            <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-10 px-4">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="font-medium text-foreground">AgencyAI</span>
          </div>
          <p>© {new Date().getFullYear()} AgencyAI. All rights reserved.</p>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="hover:text-foreground transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

