# Testing Philosophy

---

## Guiding Principle

Tests exist to give engineers **confidence that the system behaves correctly** — not to maximize a coverage percentage. Coverage is a byproduct of testing things that matter, not the objective itself.

For this platform, what matters most is that the core workflows are reliable and that regressions in critical paths are caught before they reach production:

- Users can register, authenticate, and manage their subscription lifecycle
- Resources are correctly scoped per user; cross-tenant access is blocked
- Publishing a post enqueues a build job with the correct arguments
- Stripe webhooks correctly advance subscription state

These workflows have integration tests. Thin wrappers, utility functions, and configuration parsing do not.

---

## Test Strategy

### Integration tests over unit tests

The test suite exercises the full HTTP request/response cycle using [Supertest](https://github.com/ladjs/supertest) against a real (in-memory) database. This validates routing, middleware chain, business logic, and persistence in a single test — no internal mocking required.

The tradeoff is intentional: a unit test that mocks the database can pass while the underlying query is broken. An integration test that hits the database cannot. For a platform where correctness of data operations is the primary concern, integration coverage is more valuable than isolated unit coverage.

### Database

Tests use Sequelize's `sync({ force: true })` against an SQLite in-memory instance. The schema is identical to production PostgreSQL — migrations define the structure, models define the behavior, and SQLite executes both faithfully for all covered test scenarios.

This avoids the overhead of a running PostgreSQL instance in CI while preserving schema accuracy. SQL dialect differences are not a concern for the constructs used in this codebase.

### External dependency mocking

Dependencies with external network calls are mocked at the module boundary using Jest:

- **Stripe** — `customers.create`, `checkout.sessions.create`, and `webhooks.constructEvent` return controlled responses; no network call is made
- **Bull queues** — queue `add()` calls are mocked to prevent Redis dependency in CI and to allow asserting that jobs were enqueued with the correct `siteId` and trigger arguments
- **AWS S3** — not exercised in the automated test suite; validated through manual smoke tests against a staging environment

Mocking philosophy: mock only what crosses a network or process boundary. Mock at the module level, not at the call site, to avoid test-specific branching in production code.

---

## What Is Tested

| Area | Approach |
|---|---|
| User registration | Full flow including duplicate email rejection (409) |
| Authentication | Login with valid and invalid credentials, token issuance |
| Token refresh | Refresh token cookie flow, access token renewal |
| Subscription gating | Active vs. pending user access to protected routes |
| Payment lifecycle | Checkout session creation, Stripe webhook event processing, subscription activation |
| Ownership enforcement | Accessing resources owned by a different user returns 403 |
| Post publication | Status transition to `published`, `published_at` timestamp, build queue enqueue |
| Queue behavior | Job enqueued with correct `siteId` and trigger value on publish |

---

## What Is Not Tested (and Why)

**Workers** — build, AI, Google provisioning, and analytics workers are validated through manual end-to-end testing against a staging environment with real service integrations. Mocking every external call (Next.js build, S3, Gemini, Google APIs) would produce low-signal tests that validate mock behavior rather than actual system behavior.

**Static site generation** — validated end-to-end by publishing a post in staging and confirming the live tenant site reflects the change within the expected window.

**Backoffice UI components** — validated through manual browser testing. Component test coverage is a documented future improvement.

---

## Regression Prevention

Before merging to main, the CI pipeline runs:

1. Full integration test suite (Jest + Supertest)
2. TypeScript type checking (backoffice)
3. ESLint validation (API + backoffice)
4. Next.js build (backoffice + site-template)

This combination catches the majority of regressions introduced by refactoring, dependency updates, or schema changes without requiring a comprehensive test pyramid across all layers.

---

## Running Tests

```bash
cd apps/api
npm test
```

The suite runs with `--forceExit` to prevent the process from hanging on open database handles after completion. The database is destroyed and recreated on each run via `sync({ force: true })` in `beforeAll`.
