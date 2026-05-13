# Setup Guide

Prerequisites, environment configuration, database initialization, and optional service integrations for local development.

---

## Prerequisites

| Dependency | Version | Notes |
|---|---|---|
| Node.js | 20+ | Required for all apps |
| Docker + Compose | v2+ | Runs PostgreSQL and Redis locally |
| Stripe CLI | latest | Optional — required only for webhook testing |

---

## Local Development

### 1. Start infrastructure

```bash
docker compose up -d postgres redis
```

Starts PostgreSQL on `:5432` and Redis on `:6379`. No additional configuration is needed for local development — the default credentials in `.env.example` match the Docker Compose service configuration.

### 2. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/backoffice/.env.example apps/backoffice/.env.local
```

Edit each file with your local values. Required variables are marked in the tables below.

### 3. Install dependencies

```bash
cd apps/api && npm install
cd ../backoffice && npm install
cd ../site-template && npm install
```

### 4. Run database migrations

```bash
cd apps/api
npm run migrate
```

Migrations run sequentially from `apps/api/migrations/`. Each file is a plain Node.js module exporting `up` and `down` functions. The current schema covers users, sites, posts, categories, social links, contact messages, content strategy briefs, analytics events, GA4 metrics, and Google OAuth tokens.

### 5. Start the apps

Run each in a separate terminal:

```bash
# API — http://localhost:3001
cd apps/api && npm run dev

# Backoffice — http://localhost:3000
cd apps/backoffice && npm run dev

# Build Worker (optional — required for static site generation)
cd apps/api && npm run worker:dev
```

The build worker is only needed if you intend to test static site generation locally. It requires `SITE_TEMPLATE_DIR` and a configured `STATIC_SITES_BUCKET` (or will write output locally if not set).

---

## Environment Variables

### `apps/api/.env`

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | `development` or `production` | `development` |
| `PORT` | API server port | `3001` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `blogs_tool` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for access token signing | **required** |
| `JWT_REFRESH_SECRET` | Secret for refresh token signing | **required** |
| `FRONTEND_URL` | Allowed CORS origin (backoffice) | `http://localhost:3000` |
| `LANDING_URL` | Allowed CORS origin (landing page) | `http://localhost:3002` |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) | **required** |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) | **required** |
| `STRIPE_PRICE_ID` | Stripe Price ID for the subscription plan | **required** |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 media uploads | optional |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | optional |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_S3_BUCKET` | S3 bucket for media uploads | optional |
| `RESEND_API_KEY` | Resend API key for transactional emails | optional |
| `STATIC_SITES_BUCKET` | S3 bucket for hosting generated static sites | required in prod |
| `CF_DISTRIBUTION_ID` | CloudFront distribution ID for cache invalidation | optional |
| `SITE_BASE_URL_TEMPLATE` | URL pattern for tenant sites — e.g. `https://{slug}.example.com` | required in prod |
| `SITE_TEMPLATE_DIR` | Absolute path to `apps/site-template` | auto-detected |
| `BUILDS_BASE_DIR` | Temp directory for build artifacts | `/tmp/builds` |
| `BUILD_CONCURRENCY` | Parallel site builds per worker process | `1` |
| `ENCRYPTION_KEY` | 32-byte key as 64 hex chars — used to encrypt OAuth tokens at rest | **required** |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID | **required** |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret | **required** |
| `GOOGLE_OAUTH_REDIRECT_URI` | OAuth callback URL — e.g. `https://api.example.com/api/auth/google/callback` | **required** |
| `BACKOFFICE_URL` | Backoffice base URL (redirect target after OAuth connect) | **required** |
| `SITE_BASE_DOMAIN` | Root domain for tenant sites — e.g. `example.com` — used for GA4 stream URI | required in prod |
| `GOOGLE_PROVISIONING_CONCURRENCY` | Parallel Google provisioning jobs | `2` |
| `GA_SYNC_CRON` | Cron schedule for GA4 metrics sync | `0 3 * * *` |
| `ANALYTICS_CONCURRENCY` | Parallel analytics jobs | `5` |
| `AI_JOB_CONCURRENCY` | Parallel AI content generation jobs | `2` |

### `apps/backoffice/.env.local`

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | API base URL | `http://localhost:3001` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | optional |

---

## Google Analytics & Tag Manager

The platform provisions GA4 and GTM automatically after a user connects their Google account via OAuth. Manual property or container setup is not required.

### 1. Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create or select a project.
2. Enable the following APIs under **APIs & Services → Library**:
   - Google Analytics Admin API
   - Google Analytics Data API
   - Tag Manager API

### 2. Configure the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **External** user type.
3. Fill in app name, support email, and developer contact.
4. Add the following OAuth scopes:
   - `https://www.googleapis.com/auth/analytics.edit`
   - `https://www.googleapis.com/auth/analytics.readonly`
   - `https://www.googleapis.com/auth/tagmanager.edit.containers`
   - `https://www.googleapis.com/auth/tagmanager.manage.accounts`
   - `https://www.googleapis.com/auth/tagmanager.readonly`
   - `openid`, `email`, `profile`
5. Add your Google account as a test user while the app is in testing mode.

### 3. Create OAuth credentials

1. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Add authorized redirect URIs:
   - Development: `http://localhost:3001/api/auth/google/callback`
   - Production: `https://api.yourdomain.com/api/auth/google/callback`
4. Copy the Client ID → `GOOGLE_CLIENT_ID` and Client Secret → `GOOGLE_CLIENT_SECRET`.

### 4. Generate the encryption key

OAuth refresh tokens are encrypted at rest using AES-256-GCM. Generate a 32-byte key:

```bash
openssl rand -hex 32
```

Set the output as `ENCRYPTION_KEY` in `apps/api/.env`.

---

## Stripe

### 1. Get your API keys

From the [Stripe Dashboard](https://dashboard.stripe.com):
- **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`
- **Publishable key** (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 2. Create a product and price

1. Go to **Products** and create a product with a recurring monthly price.
2. Copy the **Price ID** (`price_...`) → `STRIPE_PRICE_ID`.

### 3. Configure webhooks for local development

```bash
stripe listen --forward-to localhost:3001/api/payment/webhook
```

Copy the webhook signing secret printed by the CLI (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.

---

## Running Tests

```bash
cd apps/api
npm test
```

See [TESTING-PHILOSOPHY.md](TESTING-PHILOSOPHY.md) for a full description of the test strategy, coverage scope, and mocking approach.

---

## Docker (Production)

Each service has a dedicated Dockerfile:

| File | Purpose |
|---|---|
| `apps/api/Dockerfile` | API server |
| `apps/api/Dockerfile.worker` | Build and analytics workers |
| `apps/api/Dockerfile.googleWorker` | Google provisioning worker |

The `docker-compose.yml` at the repo root is for local development only. Production deployments use these Dockerfiles independently — typically as ECS tasks or equivalent container workloads.
