# Blogs Tool

A multi-tenant SaaS platform for creating and managing blogs. Users subscribe via the landing page, pay with a credit card, and manage their sites (posts, categories, settings) in a backoffice dashboard.

## Architecture

```
Landing Page (port 3002)  →  Backoffice (port 3000)  →  API (port 3001)
                                                              │
                                                    ┌─────────┴──────────┐
                                               PostgreSQL :5432     Redis :6379
                                                                          │
                                                                   Build Worker
                                                                  (Bull consumer)
                                                                          │
                                                               site-template build
                                                               (Next.js export)
                                                                          │
                                                               S3 upload + CDN
                                                               invalidation
```

| App              | Tech                            | Dev Port |
|------------------|---------------------------------|----------|
| `api`            | Node.js 20 + Express 5          | 3001     |
| `backoffice`     | Next.js 14 (App Router)         | 3000     |
| `landing`        | Next.js 14 (SSG)                | 3002     |
| `site-template`  | Next.js 14 (static export)      | —        |
| `lambda-edge`    | AWS Lambda@Edge (Node.js)       | —        |
| `build-worker`   | Bull consumer (Node.js process) | —        |

---

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker & Docker Compose](https://docs.docker.com/compose/)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) *(optional, for webhook testing)*

---

## Quick Start

### 1. Start infrastructure (PostgreSQL + Redis)

```bash
docker compose up -d postgres redis
```

### 2. Set up environment variables

Copy and edit each app's env file:

```bash
# API
cp apps/api/.env.example apps/api/.env

# Backoffice
cp apps/backoffice/.env.example apps/backoffice/.env.local

# Landing
cp apps/landing/.env.example apps/landing/.env.local
```

Edit the files with your own values (see [Environment Variables](#environment-variables) below).

### 3. Install dependencies

```bash
cd apps/api && npm install
cd ../backoffice && npm install
cd ../landing && npm install
cd ../site-template && npm install
```

### 4. Run database migrations

```bash
cd apps/api
npm run migrate
```

### 5. Start all apps (separate terminals)

```bash
# Terminal 1 — API (http://localhost:3001)
cd apps/api && npm run dev

# Terminal 2 — Backoffice (http://localhost:3000)
cd apps/backoffice && npm run dev

# Terminal 3 — Landing (http://localhost:3002)
cd apps/landing && npm run dev

# Terminal 4 — Build Worker (optional, see Static Site Generation section)
cd apps/api && npm run worker:dev
```

---

## Environment Variables

### `apps/api/.env`

| Variable                    | Description                                     | Default              |
|-----------------------------|-------------------------------------------------|----------------------|
| `NODE_ENV`                  | Environment (`development` / `production`)      | `development`        |
| `PORT`                      | API server port                                 | `3001`               |
| `DB_HOST`                   | PostgreSQL host                                 | `localhost`          |
| `DB_PORT`                   | PostgreSQL port                                 | `5432`               |
| `DB_NAME`                   | Database name                                   | `blogs_tool`         |
| `DB_USER`                   | Database user                                   | `postgres`           |
| `DB_PASSWORD`               | Database password                               | `postgres`           |
| `REDIS_URL`                 | Redis connection URL                            | `redis://localhost:6379` |
| `JWT_SECRET`                | Secret for access token signing                 | *(required)*         |
| `JWT_REFRESH_SECRET`        | Secret for refresh token signing                | *(required)*         |
| `FRONTEND_URL`              | Allowed CORS origin (backoffice URL)            | `http://localhost:3000` |
| `LANDING_URL`               | Allowed CORS origin (landing page URL)          | `http://localhost:3002` |
| `STRIPE_SECRET_KEY`         | Stripe secret key (`sk_test_...`)               | *(required)*         |
| `STRIPE_WEBHOOK_SECRET`     | Stripe webhook signing secret (`whsec_...`)     | *(required)*         |
| `STRIPE_PRICE_ID`           | Stripe price ID for the subscription plan       | *(required)*         |
| `AWS_ACCESS_KEY_ID`         | AWS access key (for S3 uploads)                 | *(optional)*         |
| `AWS_SECRET_ACCESS_KEY`     | AWS secret key                                  | *(optional)*         |
| `AWS_REGION`                | AWS region                                      | `us-east-1`          |
| `AWS_S3_BUCKET`             | S3 bucket name for media uploads                | *(optional)*         |
| `RESEND_API_KEY`            | Resend API key for transactional emails         | *(optional)*         |
| `STATIC_SITES_BUCKET`       | S3 bucket for hosting generated static sites    | *(required in prod)* |
| `CF_DISTRIBUTION_ID`        | CloudFront distribution ID for CDN invalidation | *(optional)*         |
| `SITE_BASE_URL_TEMPLATE`    | URL pattern for tenant sites, e.g. `https://{slug}.example.com` | *(required in prod)* |
| `SITE_TEMPLATE_DIR`         | Absolute path to the `apps/site-template` directory | auto-detected |
| `BUILDS_BASE_DIR`           | Temp directory for build artifacts              | `/tmp/builds`        |
| `BUILD_CONCURRENCY`         | Number of parallel site builds the worker runs  | `1`                  |

### `apps/backoffice/.env.local`

| Variable                          | Description                   | Default                     |
|-----------------------------------|-------------------------------|-----------------------------|
| `NEXT_PUBLIC_API_URL`             | API base URL                  | `http://localhost:3001`     |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key     | *(optional)*                |

### `apps/landing/.env.local`

| Variable                    | Description                   | Default                     |
|-----------------------------|-------------------------------|-----------------------------|
| `NEXT_PUBLIC_API_URL`       | API base URL                  | `http://localhost:3001`     |
| `NEXT_PUBLIC_BACKOFFICE_URL`| Backoffice URL                | `http://localhost:3000`     |

---

## Docker (Production)

To run the full stack with Docker:

```bash
# Copy and edit root .env with your production values
cp apps/api/.env.example .env

docker compose up --build
```

Services exposed by Docker Compose:

| Service        | Host Port | Description                                      |
|----------------|-----------|--------------------------------------------------|
| `landing`      | 3002      | Next.js landing page                             |
| `postgres`     | 5432      | PostgreSQL database                              |
| `redis`        | 6379      | Redis (queue broker)                             |
| `build-worker` | —         | Bull consumer that builds and deploys tenant sites |

> The API and Backoffice are not included in the default Docker Compose file for production; deploy them to your preferred platform (e.g. Railway, Render, Vercel, or a VPS).

---

## Database Migrations

```bash
cd apps/api

# Run all pending migrations
npm run migrate

# Roll back all migrations
npm run migrate:undo
```

---

## Running Tests

```bash
cd apps/api
npm test
```

---

## Stripe Webhook (local development)

Forward Stripe events to your local API:

```bash
cd apps/api
npm run stripe:listen
```

Trigger test events:

```bash
npm run stripe:trigger:checkout
npm run stripe:trigger:subscription:updated
```

---

## Project Structure

```
/
├── apps/
│   ├── api/              # Node.js + Express — REST API, auth, payments, uploads
│   │   └── src/
│   │       ├── services/
│   │       │   ├── buildQueue.js      # Bull queue helper (enqueue builds)
│   │       │   └── s3DeployService.js # S3 upload + CloudFront invalidation
│   │       └── workers/
│   │           └── buildWorker.js     # Bull consumer — builds & deploys sites
│   ├── backoffice/       # Next.js 14 (App Router) — authenticated dashboard
│   ├── landing/          # Next.js 14 (SSG) — marketing & sign-up page
│   ├── site-template/    # Next.js 14 (static export) — tenant blog template
│   │   ├── pages/        # Home, [categorySlug], post/[postSlug], contato
│   │   ├── components/   # Layout, PostCard, Analytics (GA/GTM/Pixel)
│   │   ├── lib/          # data.ts, palettes.ts, types.ts
│   │   └── scripts/      # generate-sitemap.js (runs post-build)
│   └── lambda-edge/      # AWS Lambda@Edge — wildcard subdomain routing
│       └── viewer-request.js
├── plans/                # Project planning documents
└── docker-compose.yml
```

---

## Static Site Generation

Each tenant's blog is compiled to plain HTML/CSS/JS and served from a CDN — no Node.js server is exposed to blog visitors.

### How a build is triggered

| Action in backoffice              | API route                               | Build enqueued? |
|-----------------------------------|-----------------------------------------|-----------------|
| Publish a post                    | `PUT /api/sites/:id/posts/:id/publish`  | Yes             |
| Update site settings              | `PUT /api/sites/:id`                    | Yes             |

When a build is enqueued, the worker (`apps/api/src/workers/buildWorker.js`) picks it up from the Bull (Redis) queue and runs the following steps:

1. **Fetch data** — queries the database and writes JSON files into `/tmp/builds/<siteId>/data/`:
   - `site.json` — site metadata, palette, analytics IDs
   - `posts.json` — all published posts with their categories
   - `categories.json` — all categories
   - `social-links.json` — social network links
2. **Build** — runs `npm run build` inside `apps/site-template` with `SITE_DATA_PATH` pointing to the data directory.
   The template reads the JSON files at build time (no runtime DB access).
   A `postbuild` script generates `sitemap.xml` and updates `robots.txt` in the `out/` folder.
3. **Deploy** — copies the `out/` folder to a tenant-specific temp directory, uploads it to the S3 bucket under the prefix `<siteSlug>/`, and creates a CloudFront cache invalidation for `/<siteSlug>/*`.

### Local testing

> You can build and preview any tenant's site **without AWS credentials** by running the template directly.

**Step 1 — Create the data directory with sample JSON files:**

```bash
mkdir -p /tmp/builds/test-site/data
```

Create `/tmp/builds/test-site/data/site.json`:

```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "name": "Meu Blog Local",
  "slug": "meu-blog",
  "colorPalette": "ocean_breeze",
  "logoUrl": null,
  "faviconUrl": null,
  "contactEmail": "contato@meublog.com",
  "whatsapp": null,
  "address": null,
  "gaTrackingId": null,
  "gtmContainerId": null,
  "fbPixelId": null,
  "customHeadScripts": null
}
```

Create `/tmp/builds/test-site/data/posts.json`, `categories.json`, and `social-links.json` with `[]` (empty arrays) or sample data following the same shape as the Sequelize models.

**Step 2 — Build the site:**

```bash
cd apps/site-template

SITE_DATA_PATH=/tmp/builds/test-site/data \
SITE_BASE_URL=http://localhost:3003 \
npm run build
```

The static files are generated in `apps/site-template/out/`.

**Step 3 — Serve and preview:**

```bash
# Using npx serve (install once: npm i -g serve)
serve apps/site-template/out -p 3003

# Or with Python
python3 -m http.server 3003 --directory apps/site-template/out
```

Open [http://localhost:3003](http://localhost:3003) in your browser.

**Step 4 — Test the full queue flow locally (with Redis running):**

```bash
# Ensure PostgreSQL and Redis are running
docker compose up -d postgres redis

# Start the build worker (separate terminal)
cd apps/api && npm run worker:dev
```

Publish any post via the Backoffice or call the API directly:

```bash
curl -X PUT http://localhost:3001/api/sites/<siteId>/posts/<postId>/publish \
  -H "Authorization: Bearer <token>"
```

The worker will log its progress and write the built files to `/tmp/builds/<siteId>/out/`.
Because `STATIC_SITES_BUCKET` is not set, the S3 upload step is skipped automatically.

---

### Production deployment

**Infrastructure required:**

| Resource                   | Purpose                                                         |
|----------------------------|-----------------------------------------------------------------|
| S3 bucket                  | Hosts the generated static files, one prefix per tenant slug    |
| CloudFront distribution    | CDN in front of the S3 bucket; wildcard CNAME `*.example.com`  |
| Lambda@Edge (us-east-1)    | Viewer Request handler that rewrites URIs to the correct prefix |
| Redis (ElastiCache or SaaS)| Bull queue broker                                               |

**Lambda@Edge setup (`apps/lambda-edge/viewer-request.js`):**

1. Set the `BASE_DOMAIN` constant (or environment variable) to your root domain (e.g. `example.com`).
2. Deploy to Lambda in **us-east-1** and associate it with the CloudFront distribution's **Viewer Request** event.
3. The function reads the `Host` header (e.g. `my-blog.example.com`), extracts the slug, and rewrites the URI from `/path` to `/my-blog/path` so CloudFront reads from the correct S3 prefix.

```bash
# Package and deploy (requires AWS CLI)
cd apps/lambda-edge
npm run package   # creates lambda-edge.zip
npm run deploy    # calls aws lambda update-function-code
```

**Environment variables for the build worker in production** (set in Docker Compose, ECS task definition, or equivalent):

```env
REDIS_URL=redis://<host>:6379
DB_HOST=<rds-endpoint>
DB_NAME=blogs_tool
DB_USER=<user>
DB_PASSWORD=<password>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
STATIC_SITES_BUCKET=my-static-sites-bucket
CF_DISTRIBUTION_ID=EXXXXXXXXX
SITE_BASE_URL_TEMPLATE=https://{slug}.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
BUILD_CONCURRENCY=2
```

**Build flow end-to-end (production):**

```
User publishes post in Backoffice
        │
        ▼
API enqueues job { siteId, trigger } → Redis (Bull)
        │
        ▼
build-worker picks up job
  1. Queries PostgreSQL → writes JSON files to /tmp/builds/<siteId>/data/
  2. Runs `npm run build` in apps/site-template (using SITE_DATA_PATH)
  3. Copies out/ to /tmp/builds/<siteId>/out/
  4. Uploads all files to s3://STATIC_SITES_BUCKET/<slug>/
  5. Creates CloudFront invalidation for /<slug>/*
        │
        ▼
Visitor requests https://<slug>.example.com/some-post/
  → Lambda@Edge rewrites URI to /<slug>/some-post/index.html
  → CloudFront serves from S3
  → Static HTML delivered in ~50–100 ms
```

Jobs are retried up to **3 times** with exponential back-off (5 s base delay) on failure.

---

## Tech Stack

| Layer             | Technology                                        |
|-------------------|---------------------------------------------------|
| Backend API       | Node.js 20 + Express 5                            |
| Database          | PostgreSQL 16 + Sequelize ORM                     |
| Auth              | JWT (access + refresh tokens, httpOnly cookies)   |
| Cache / Queues    | Redis + Bull                                      |
| Backoffice        | Next.js 14 + Tailwind CSS + shadcn/ui             |
| Landing           | Next.js 14 (static export)                        |
| Site Generator    | Next.js 14 (static export, per-tenant build)      |
| CDN routing       | AWS Lambda@Edge (wildcard subdomain → S3 prefix)  |
| Payments          | Stripe (Checkout + Webhooks)                      |
| File Storage      | AWS S3                                            |
| Email             | Resend                                            |
| Containerization  | Docker + Docker Compose                           |
