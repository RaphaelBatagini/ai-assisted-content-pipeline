# AI Philosophy

This document describes how AI is used in this platform — both as a product feature and as an engineering tool — and the principles that govern its use in both contexts.

---

## Guiding Principle

AI in this system is an **augmentation layer**, not an autonomous pipeline. Every AI-generated output passes through human judgment before it has any effect on published content. The system is explicitly designed so that no AI-generated content can reach production without a deliberate human action.

This is not a safeguard bolted on after the fact. It reflects a design decision: AI is good at generating plausible first drafts at scale; humans are good at assessing quality, brand voice fit, and factual accuracy. The platform assigns each role accordingly.

---

## Where AI Is Used

### 1. Content Research (Researcher Agent)

**Trigger**: A user submits a content strategy brief containing company context, target audience, pain points, and differentiators.

**Process**: The `aiWorker` sends this brief to Gemini 2.5 Flash using the researcher prompt. The model returns a structured JSON array of 15 prioritized content topics, each containing:

- Title and editorial angle
- Target keyword
- Content format (How-to, Listicle, Comparison, Case Study, Thought Leadership)
- Priority ranking (1–15)
- Outline of suggested H2 headings

**Output validation**: The response is parsed as JSON before any data is persisted. Responses that fail JSON parsing are treated as worker errors and retried — not silently stored as malformed data.

**Human gate**: The topic roadmap is presented in the backoffice before writing begins. Users review, edit, or reject individual topics before approving the writing phase. The writing phase does not start automatically.

---

### 2. Content Writing (Writer Agent)

**Trigger**: User approves the content roadmap. The system enqueues one write job per topic, up to a configurable batch size (default: 5).

**Process**: For each topic, the writer prompt receives the topic metadata, the original brief, and site context. Gemini returns a structured JSON object with:

- `title`, `slug`, `excerpt`
- `content` (HTML with semantic heading structure: `h2`, `h3`, `p`, `ul`, `li`)
- `seoTitle`, `seoDescription`
- `readingTimeMinutes` (estimated from word count)

**Output validation**: Responses are parsed, required fields are validated, and posts are inserted with `status: draft`. Reading time is calculated server-side as a secondary check.

**Human gate**: Draft posts appear in the backoffice post list filtered by "Draft" status. The editor opens each post in the rich text editor, reviews and edits the content, then publishes manually. Publishing is an explicit action that triggers the build pipeline.

---

## Prompt Orchestration

Prompts are maintained as JavaScript modules under `apps/api/src/prompts/`. Each prompt:

- Accepts a typed input object (brief data, topic metadata, site context)
- Documents its expected output schema
- Is versioned alongside the codebase — prompt changes go through pull requests like any other code change

The AI provider is abstracted behind a service interface (`GeminiProvider` implements `AIProvider`). Swapping providers or adding model comparison logic does not require changes to worker code.

---

## Human-in-the-Loop Design

| Stage | System does | Human decides |
|---|---|---|
| Brief submission | Generates 15-topic research roadmap (JSON) | Reviews topics, edits titles/keywords, rejects unsuitable topics |
| Roadmap approval | Generates HTML drafts for approved topics | Reviews each draft, edits content and metadata, decides to publish |
| Publication | Nothing — not involved | Clicks "Publish", triggering the static build pipeline |

The content lifecycle is: `ai-generated draft` → `human review` → `human edit` → `human publish`. There is no path from AI output to published content that bypasses this sequence.

---

## Quality Controls

- **JSON parsing gates** — AI responses that fail JSON parsing are treated as worker errors and retried with exponential backoff, not stored as broken records
- **Required field validation** — posts are not created if the AI response is missing critical fields (`title`, `content`, `slug`)
- **Draft-only persistence** — AI output always enters the system as `status: draft`; the transition to `published` is controlled exclusively by humans through the backoffice
- **Prompt versioning** — prompts live in the source tree and change through pull requests, creating a natural review gate for prompt modifications
- **Provider abstraction** — the AI service layer is decoupled from worker logic, making it straightforward to add output logging, response validation middleware, or model fallbacks without restructuring the workers

---

## AI in the Engineering Process

During development of this platform, AI-assisted coding tools were used for:

- Scaffolding boilerplate (route handlers, migration files, component shells)
- Drafting and iterating on prompt templates
- Generating integration test case skeletons
- Documentation drafts

In all cases, outputs were reviewed, edited, and validated before being committed. Suggestions that introduced security issues — missing ownership checks, unvalidated inputs, insecure token handling — were identified during review and corrected before landing.

The same human-in-the-loop principle that applies to content generation applies to AI-assisted code: the model proposes, the engineer decides.

---

## What This Platform Does Not Do

- Auto-publish AI-generated content
- Use AI to make deployment or infrastructure decisions
- Commit AI-generated code without review
- Trust AI output without structural validation
- Use AI as a substitute for engineering judgment on architecture or security

The goal is a system where AI accelerates the content workflow — reducing the time from "I need 15 blog posts" to "I have 15 reviewed drafts ready to edit" — without removing human judgment from the critical path.
