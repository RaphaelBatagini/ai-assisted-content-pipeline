# Plan: Content Strategy Brief Feature

## TL;DR
Add a "Content Strategy Brief" feature that warns users when a site lacks one, guides them through a 4-step wizard to collect business context, then uses AI (Gemini) to asynchronously research relevant topics (researcher agent) and write X draft posts (writer agent). The frontend polls for status updates while jobs run in a Bull queue.

---

## Decisions
- Feature name: **Content Strategy Brief**
- Form: **Multi-step wizard** (4 steps)
- Generation feedback: **Async with polling** (React Query refetchInterval)
- Language: **en-US hardcoded** in prompts
- One brief per site (1:1 relationship)
- Generated posts land as **draft** status for user review
- Writer generates `POSTS_TO_GENERATE` posts (env var, default 5)
- AI provider: starts with **Gemini** (`gemini-1.5-pro`), abstracted for future switching
- Out of scope: brief regeneration/editing after creation, Dockerfile changes

---

## Phase 1 — Backend: Database & Models

### Step 1 — Migration: `008-create-content-strategy-briefs.js`
File: `apps/api/migrations/008-create-content-strategy-briefs.js`
- Table: `content_strategy_briefs`
- Columns: id (UUID PK), site_id (UUID FK→sites UNIQUE CASCADE), company_name (STRING NOT NULL), product_description (TEXT NOT NULL), industry (STRING NOT NULL), target_audience (TEXT NOT NULL), pain_points (TEXT NOT NULL), differentiators (TEXT), competitors (TEXT), conversion_goal (STRING), content_goals (TEXT, comma-separated), content_formats (TEXT, comma-separated), tone_of_voice (ENUM: 'professional','casual','technical','conversational' DEFAULT 'professional'), status (ENUM: 'pending','researching','writing','ready','error' DEFAULT 'pending'), error_message (TEXT NULL), roadmap_json (TEXT NULL), posts_generated (INTEGER DEFAULT 0), created_at, updated_at
- UNIQUE constraint on site_id

### Step 2 — Model: `ContentStrategyBrief.js`
File: `apps/api/src/models/ContentStrategyBrief.js`
- Follow existing model patterns (UUID PK, DataTypes matching migration)
- Export from `src/models/index.js`

### Step 3 — Model Associations
File: `apps/api/src/models/index.js`
- `Site.hasOne(ContentStrategyBrief, { foreignKey: 'siteId' })`
- `ContentStrategyBrief.belongsTo(Site, { foreignKey: 'siteId' })`

---

## Phase 2 — Backend: AI Service Abstraction

### Step 4 — AI Provider Interface
File: `apps/api/src/services/ai/AIProvider.js`
- Class `AIProvider` with abstract method `generate(systemPrompt, userPrompt, options = {})`
- Throws error if not implemented

### Step 5 — Gemini Provider
File: `apps/api/src/services/ai/GeminiProvider.js`
- Class `GeminiProvider extends AIProvider`
- Uses `@google/generative-ai` package
- Model: `gemini-1.5-pro`
- API key from `process.env.GEMINI_API_KEY`
- Returns plain text string from `generateContent()`

### Step 6 — AI Factory
File: `apps/api/src/services/ai/index.js`
- `createAIProvider()` factory function
- Reads `process.env.AI_PROVIDER` (defaults to `'gemini'`)
- Returns correct provider instance (throws for unknown providers)

### Step 7 — Add Gemini Package
File: `apps/api/package.json`
- Add `@google/generative-ai` to dependencies

---

## Phase 3 — Backend: Prompts

### Step 8 — Researcher Prompt
File: `apps/api/src/prompts/researcher.js`
- Export `buildResearcherPrompt(brief)` that returns `{ systemPrompt, userPrompt }`
- System prompt: establishes role as expert B2B SaaS content strategist targeting en-US
- User prompt: injects brief fields (company, product, audience, pain points, competitors, goals, formats, tone)
- Instructs AI to return valid JSON array of content topics with fields: title, angle, targetKeyword, contentFormat, priority, outline (array of H2s)
- Request more topics than POSTS_TO_GENERATE (request 15 to always have enough)

### Step 9 — Writer Prompt
File: `apps/api/src/prompts/writer.js`
- Export `buildWriterPrompt(topic, brief, siteName)` that returns `{ systemPrompt, userPrompt }`
- System prompt: role as expert B2B SaaS content writer, en-US, tone from brief
- User prompt: injects topic (title, angle, targetKeyword, outline), brief context, siteName
- Instructs AI to return valid JSON with: title, slug, excerpt (150 chars max), content (rich HTML with h2/h3/p/ul), seoTitle, seoDescription (160 chars max), readingTimeMinutes

---

## Phase 4 — Backend: AI Queue & Worker

### Step 10 — AI Queue Service
File: `apps/api/src/services/aiQueue.js`
- Follow pattern of `buildQueue.js` (Bull queue, Redis)
- Queue name: `ai-jobs`
- Export: `aiQueue`, `enqueueResearch(briefId, siteId)`
- `enqueueResearch` adds job type `{ type: 'research', briefId, siteId }` with 3 retries, exponential backoff

### Step 11 — AI Worker
File: `apps/api/src/workers/aiWorker.js`
- Standalone script (like `buildWorker.js`): `require('dotenv').config()`, load models
- Processes `ai-jobs` queue
- **Research job handler:**
  1. Fetch `ContentStrategyBrief` by briefId (include Site)
  2. Update status → `'researching'`
  3. Build researcher prompt using `buildResearcherPrompt(brief)`
  4. Call `createAIProvider().generate(systemPrompt, userPrompt)`
  5. Parse JSON response → roadmap array
  6. Save `roadmap_json` (JSON.stringify) and status → `'writing'`
  7. Pick top N topics (N = `process.env.POSTS_TO_GENERATE || 5`)
  8. For each topic, add `{ type: 'write-post', briefId, siteId, topic }` to `aiQueue`
- **Write-post job handler:**
  1. Fetch `ContentStrategyBrief` + Site
  2. Build writer prompt using `buildWriterPrompt(topic, brief, site.name)`
  3. Call AI provider generate()
  4. Parse JSON response
  5. Create `Post` record (status: 'draft', siteId, authorId from site.userId)
  6. Atomically increment `posts_generated` on the brief
  7. When `posts_generated === POSTS_TO_GENERATE`: update status → `'ready'`
- **Error handling:** On any failure, update brief status → `'error'`, save `error_message`
- Concurrency: configurable via `AI_JOB_CONCURRENCY` env (default 2)

### Step 12 — Worker Script in package.json
File: `apps/api/package.json`
- Add script: `"worker:ai": "node src/workers/aiWorker.js"`
- Add script: `"worker:ai:dev": "nodemon src/workers/aiWorker.js"`

---

## Phase 5 — Backend: Routes & Validators

### Step 13 — Validator
File: `apps/api/src/validators/contentStrategyBrief.js`
- Joi schema: company_name (required, 1-200), product_description (required), industry (required, 1-100), target_audience (required), pain_points (required), differentiators (optional), competitors (optional), conversion_goal (optional), content_goals (optional), content_formats (optional), tone_of_voice (optional, enum)

### Step 14 — Route File
File: `apps/api/src/routes/contentStrategyBrief.js`
- `GET /` → fetch brief for siteId (include status, roadmap_json summary); returns 404 if none
- `POST /` → validate, check no existing brief for site (return 409 if exists), create brief, call `enqueueResearch(brief.id, siteId)`, return 201 with brief
- Both protected by `auth, ownership` (ownership already sets `req.site`)

### Step 15 — Register Routes in app.js
File: `apps/api/src/app.js`
- Add: `app.use('/api/sites/:siteId/content-strategy-brief', auth, ownership, contentStrategyBriefRouter)`

### Step 16 — New env vars in .env
File: `apps/api/.env`
- `POSTS_TO_GENERATE=5`
- `AI_PROVIDER=gemini`
- `AI_JOB_CONCURRENCY=2`

---

## Phase 6 — Frontend: API Layer

### Step 17 — API Functions
File: `apps/backoffice/lib/api.ts`
- `getContentStrategyBrief(siteId)` → GET `/api/sites/${siteId}/content-strategy-brief`
- `createContentStrategyBrief(siteId, data)` → POST `/api/sites/${siteId}/content-strategy-brief`

---

## Phase 7 — Frontend: Components & Pages

### Step 18 — Site-Level Layout
File: `apps/backoffice/app/(dashboard)/sites/[siteId]/layout.tsx` (NEW)
- Client component that reads `siteId` from `useParams()`
- Fetches brief via `getContentStrategyBrief(siteId)` using React Query
- Renders `<ContentBriefBanner siteId={siteId} brief={brief} />` above `{children}`

### Step 19 — ContentBriefBanner Component
File: `apps/backoffice/components/ContentBriefBanner.tsx`
- Props: `{ siteId: string, brief: Brief | null }`
- Render logic:
  - `brief === null`: yellow warning banner — "Your site is missing a Content Strategy Brief. Fuel your growth engine." + CTA button linking to `/sites/[siteId]/content-strategy-brief`
  - `brief.status === 'researching'`: blue info banner — "Researching your industry and content opportunities…" + spinner
  - `brief.status === 'writing'`: blue info banner — "Writing your posts…" with progress hint
  - `brief.status === 'error'`: red error banner — "Content generation failed. [error message]"
  - `brief.status === 'ready'`: hidden (no banner)
- Uses `Alert` component pattern (can use existing `ui/` or simple Tailwind div)

### Step 20 — Content Strategy Brief Page
File: `apps/backoffice/app/(dashboard)/sites/[siteId]/content-strategy-brief/page.tsx`
- 4-step wizard using React state (`currentStep: 1-4`)
- Each step rendered conditionally; Back/Next/Submit buttons
- Uses `react-hook-form` + `zod` for validation (validate per step on Next)
- **Step 1 — Company & Product:** company_name, product_description (textarea), industry
- **Step 2 — Your Audience:** target_audience (textarea, describe ICP), pain_points (textarea), competitors (textarea, optional)
- **Step 3 — Goals & Positioning:** differentiators (textarea, optional), conversion_goal (text: e.g., "book a demo"), content_goals (checkboxes: Brand Awareness, Lead Generation, SEO, Customer Education)
- **Step 4 — Content Style:** content_formats (checkboxes: How-to Guides, Listicles, Comparisons, Case Studies, Thought Leadership), tone_of_voice (select: Professional, Casual, Technical, Conversational)
- On submit: call `createContentStrategyBrief` mutation → switches view to polling state
- **Polling state:** shows animated stepper/progress view; uses React Query with `refetchInterval: 3000` when status is 'researching' or 'writing', `false` otherwise
- When `status === 'ready'`: shows success view with "X posts have been drafted" + link to `/sites/[siteId]/posts`
- When `status === 'error'`: shows error message

### Step 21 — Update Sidebar Nav
File: `apps/backoffice/app/(dashboard)/layout.tsx`
- In `SiteNavItem`, add nav link: `Content Strategy Brief` → `/sites/${site.id}/content-strategy-brief`
- Use icon: `Sparkles` from lucide-react
- Add alongside Settings, Categories, Posts in the sub-nav

---

## Relevant Files

- `apps/api/migrations/008-create-content-strategy-briefs.js` — New table
- `apps/api/src/models/ContentStrategyBrief.js` — New model
- `apps/api/src/models/index.js` — Register model + associations
- `apps/api/src/services/ai/AIProvider.js` — Abstract AI class
- `apps/api/src/services/ai/GeminiProvider.js` — Gemini implementation
- `apps/api/src/services/ai/index.js` — Factory
- `apps/api/src/services/aiQueue.js` — Bull queue for AI jobs
- `apps/api/src/prompts/researcher.js` — Researcher prompt builder
- `apps/api/src/prompts/writer.js` — Writer prompt builder
- `apps/api/src/workers/aiWorker.js` — Background job processor
- `apps/api/src/validators/contentStrategyBrief.js` — Joi validation
- `apps/api/src/routes/contentStrategyBrief.js` — REST endpoints
- `apps/api/src/app.js` — Route registration
- `apps/api/.env` — New env vars
- `apps/api/package.json` — New scripts + @google/generative-ai dep
- `apps/backoffice/lib/api.ts` — New API functions
- `apps/backoffice/components/ContentBriefBanner.tsx` — Warning banner
- `apps/backoffice/app/(dashboard)/sites/[siteId]/layout.tsx` — Site-level layout (NEW)
- `apps/backoffice/app/(dashboard)/sites/[siteId]/content-strategy-brief/page.tsx` — Wizard page (NEW)
- `apps/backoffice/app/(dashboard)/layout.tsx` — Add sidebar nav item

---

## Verification

1. Run `npm run migrate` in apps/api — verify `content_strategy_briefs` table exists with all columns
2. POST `/api/sites/:siteId/content-strategy-brief` with valid body → 201 response, brief created with `status: 'pending'`
3. Verify `ai-jobs` queue receives a research job (check Redis/Bull dashboard or logs)
4. Start `npm run worker:ai` — verify research job processes, brief status changes to `'researching'` then `'writing'`
5. Verify writer jobs run and X draft posts appear in `posts` table for the site
6. Verify brief `status` → `'ready'` and `posts_generated` === POSTS_TO_GENERATE
7. Frontend: create a new site → navigate to any site page → banner appears
8. Click banner CTA → 4-step wizard renders, validate each step
9. Submit form → polling view appears, status transitions shown
10. When ready → success view shows correct post count, link to posts list works
11. Sidebar: new "Content Strategy Brief" nav item visible and links correctly
