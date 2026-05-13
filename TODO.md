# Roadmap

Platform development organized by initiative. Completed phases are summarized; active and upcoming work is detailed below.

---

## Completed

| Phase | Scope |
|---|---|
| Infrastructure | Docker Compose setup, PostgreSQL + Redis, Sequelize migrations, environment configuration |
| Backend Core | JWT authentication (register, login, refresh, logout), site/post/category/social-link CRUD, ownership middleware, media uploads to S3, contact form, integration tests |
| Payment | Stripe Checkout session creation, webhook handler, subscription activation |
| Backoffice | Next.js 14 App Router setup, auth screens, payment-pending screen, site management, category management, post editor (TipTap), rich text with inline image upload |
| Static Site Generator | `site-template` Next.js export project, Bull build worker, S3 upload + CloudFront invalidation, Lambda@Edge wildcard subdomain routing |
| AI Content Pipeline | Content strategy brief model, two-phase AI workflow (researcher + writer via Gemini 2.5 Flash), draft post generation, backoffice brief status tracking |
| Tracking & Analytics | Custom CTA event tracking endpoint (fire-and-forget), GA4 Data API integration, daily analytics sync worker (cron), backoffice analytics dashboard |

---

## Pending Work

### SEO Review Agent

Adds a third AI phase to the content pipeline: post-draft SEO analysis.

- [ ] `POST /api/sites/:siteId/ai/seo-review` — accepts post content, returns structured list of SEO suggestions (title, meta description, keyword density, heading structure, internal linking)
- [ ] SEO review panel in the post editor — interactive checklist surfacing agent suggestions inline
- [ ] Agent prompt in `apps/api/src/prompts/seoReviewer.js`, consistent with existing researcher/writer pattern

---

### Publication Scheduling

Allows authors to schedule posts for future publication without manual intervention.

- [ ] Add `scheduled_at` (timestamptz, nullable) column to `posts`
- [ ] Add `scheduled` value to the `posts.status` enum
- [ ] `PUT /api/sites/:siteId/posts/:postId/schedule` — sets `scheduled_at`, transitions status to `scheduled`
- [ ] Scheduled publish worker: cron job (Bull) that queries posts where `scheduled_at <= now()` and `status = scheduled`, publishes them, and enqueues a build job
- [ ] Backoffice scheduling UI: date/time picker on the post editor, visible only when the post is in draft
- [ ] Scheduled posts view: filterable list with cancel and reschedule actions

---

### Content Grid Review & Continuity

Extends the AI content workflow with topic-level management and iterative feedback before writing begins.

**Topic management**
- [ ] Add `status` (`pending_review` | `approved` | `rejected`), `feedback`, and `order` fields to roadmap topics (either extend `content_strategy_briefs` or introduce a `roadmap_topics` table with a `brief_id` FK)
- [ ] `GET /api/sites/:siteId/ai/roadmap/topics` — list all topics with status and metadata
- [ ] `PUT /api/sites/:siteId/ai/roadmap/topics/:topicId` — edit title, description, keywords, or suggested category
- [ ] `DELETE /api/sites/:siteId/ai/roadmap/topics/:topicId` — remove a topic from the grid

**Grid regeneration with feedback**
- [ ] `POST /api/sites/:siteId/ai/roadmap/regenerate` — accepts `{ feedback: string }`, regenerates the full grid incorporating feedback while preserving any already-published or in-draft topics
- [ ] `POST /api/sites/:siteId/ai/roadmap/approve` — marks the grid as approved and triggers writing for the first N topics (configurable, default 5)

**Backoffice grid review screen**
- [ ] Topic cards with inline editing (title, description, category, keywords)
- [ ] Drag-and-drop reordering
- [ ] Free-text feedback field + "Regenerate Grid" button with preview before confirming replacement
- [ ] "Approve Grid and Generate Posts" button — disabled until grid is in `approved` state; triggers background writing and redirects to post list

**Automatic grid expansion**
- [ ] Add `auto_expand_threshold` (float, default `0.8`) and `last_expanded_at` to `sites`
- [ ] Expansion cron worker: calculates `ratio = published_topics / total_non_rejected_topics` per site; when `ratio >= threshold`, enqueues an expansion job
- [ ] Expansion job: calls the researcher agent with the existing grid as context, requests N new complementary topics, inserts them with `status: pending_review`
- [ ] Backoffice notification (badge or toast) when new topics are awaiting review
- [ ] `GET /api/sites/:siteId/ai/roadmap/expansion-status` — returns current ratio, configured threshold, and last expansion date
- [ ] Site settings panel: toggle auto-expansion, configure threshold

---

### Infrastructure & Deployment

Operational readiness for production environments.

- [ ] Production-ready Dockerfiles reviewed and validated for each service (API, worker, Google worker)
- [ ] GitHub Actions CI pipeline: lint → test → type check → build → Docker image push to ECR
- [ ] CD pipeline: deploy to ECS (or equivalent) on successful main branch build
- [ ] Staging environment with real service integrations (Stripe test mode, Google APIs, S3)
- [ ] Secrets management via AWS Secrets Manager (replace `.env` files in production)
- [ ] Structured logging (JSON) across API and workers for log aggregation

---

## Open Decisions

| Decision | Options | Current thinking |
|---|---|---|
| Custom domains | Free subdomain / User-provided CNAME | Free subdomain in current form; CNAME support requires per-tenant CloudFront distribution |
| Subscription model | Monthly recurring / One-time payment | Monthly recurring via Stripe Subscription |
| AI provider strategy | Single provider (Gemini) / Multi-provider with fallback | Single provider for now; provider abstraction is in place for future changes |
| Worker infrastructure | Single multi-worker process / Separate containers per worker type | Separate Dockerfiles exist; deployment strategy depends on scale requirements |
| Backoffice component tests | None / Playwright E2E / React Testing Library | Not prioritized; manual browser testing covers current scope |
