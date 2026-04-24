# Blogs Tool

A multi-tenant SaaS platform for creating and managing blogs. Users subscribe via the landing page, pay with a credit card, and manage their sites (posts, categories, settings) in a backoffice dashboard.

## Architecture

```
Landing Page (port 3002)  →  Backoffice (port 3000)  →  API (port 3001)
                                                              │
                                                         PostgreSQL :5432
                                                         Redis      :6379
```

| App         | Tech                        | Dev Port |
|-------------|-----------------------------|----------|
| `api`       | Node.js 20 + Express 5      | 3001     |
| `backoffice`| Next.js 14 (App Router)     | 3000     |
| `landing`   | Next.js 14 (SSG)            | 3002     |

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

| Service    | Host Port |
|------------|-----------|
| Landing    | 3002      |
| PostgreSQL | 5432      |
| Redis      | 6379      |

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
│   ├── api/          # Node.js + Express — REST API, auth, payments, uploads
│   ├── backoffice/   # Next.js 14 (App Router) — authenticated dashboard
│   └── landing/      # Next.js 14 (SSG) — marketing & sign-up page
├── plans/            # Project planning documents
└── docker-compose.yml
```

---

## Tech Stack

| Layer            | Technology                              |
|------------------|-----------------------------------------|
| Backend API      | Node.js 20 + Express 5                  |
| Database         | PostgreSQL 16 + Sequelize ORM           |
| Auth             | JWT (access + refresh tokens, httpOnly cookies) |
| Cache / Queues   | Redis + Bull                            |
| Backoffice       | Next.js 14 + Tailwind CSS + shadcn/ui   |
| Landing          | Next.js 14 (static export)              |
| Payments         | Stripe (Checkout + Webhooks)            |
| File Storage     | AWS S3                                  |
| Email            | Resend                                  |
| Containerization | Docker + Docker Compose                 |
