# Plano — Fase 7: Tracking & Analytics

## TL;DR
Pipeline completo de analytics: tracking fire-and-forget de cliques em CTAs nos sites estáticos (enfileirado via Bull), snapshots diários de métricas via GA4 Data API (cron job registrado no worker), e dashboard por site no backoffice.

---

## Fase 7A — Banco de Dados & Models

**Passo 1** — Migration `009-add-ga-property-id-to-sites.js`
- Adiciona `ga_property_id` (varchar nullable) na tabela `sites`
- Campo separado de `ga_tracking_id` (tag client-side `G-XXXXXXXX`); este é o Property ID numérico necessário para a Data API

**Passo 2** — Migration `010-create-analytics-tables.js` — 3 novas tabelas:
- `analytics_events`: id UUID PK, site_id FK, post_id FK nullable, event_type varchar, metadata JSONB, ip varchar, user_agent varchar, created_at
- `post_analytics`: id UUID PK, site_id FK, post_id FK, date DATE, pageviews INT, sessions INT, avg_session_duration_seconds FLOAT, bounce_rate FLOAT — UNIQUE(post_id, date)
- `site_analytics`: id UUID PK, site_id FK, date DATE, sessions INT, users INT, new_users INT, avg_session_duration_seconds FLOAT, bounce_rate FLOAT, organic_sessions INT nullable — UNIQUE(site_id, date)

**Passo 3** — Models: `AnalyticsEvent.js`, `PostAnalytics.js`, `SiteAnalytics.js` (seguir padrão existente: UUID PK, Sequelize, underscored)

**Passo 4** — Atualizar `models/index.js` com as associações

---

## Fase 7B — Fila de Eventos & API (Fire-and-Forget)

**Passo 5** — `apps/api/src/services/analyticsQueue.js`
- Nova fila Bull `analytics-events` (mesma config Redis de buildQueue/aiQueue)
- Exporta `enqueueAnalyticsEvent(data)`

**Passo 6** — `apps/api/src/routes/analytics.js` registrado em `app.js`:
- `POST /api/analytics/events` — público, rate-limited
  - Valida body: `siteId`, `eventType` (enum: `'cta_click'`), `postId` (nullable), `metadata` (objeto opcional)
  - Retorna **202 imediatamente** — nenhuma escrita no DB no caminho da request
  - Chama `enqueueAnalyticsEvent(payload)` de forma assíncrona
- `GET /api/sites/:siteId/analytics/overview` — autenticado + ownership
- `GET /api/sites/:siteId/analytics/posts` — autenticado, paginado (params: `limit`, `page`, `startDate`, `endDate`)
- `GET /api/sites/:siteId/analytics/categories` — autenticado, paginado

**Passo 7** — `apps/api/src/workers/analyticsWorker.js`
- Consome fila `analytics-events`, escreve registro `AnalyticsEvent` no DB
- Também processa job type `ga-sync` (Fase 7C)
- Erros engolidos silenciosamente — apenas log, nunca relança

---

## Fase 7C — GA4 Data API Sync (Cron Diário)

**Passo 8** — `apps/api/src/services/ga4Service.js`
- Usa pacote npm `@google-analytics/data`
- Auth via conta de serviço: env var `GOOGLE_APPLICATION_CREDENTIALS_JSON` (JSON base64-encoded — evita montagem de arquivo em containers)
- `syncSiteMetrics(site, dateRange)` chama GA4 RunReport:
  - **Nível site**: sessions, users, newUsers, avgSessionDuration, bounceRate, sessões orgânicas Google
  - **Nível post**: pageviews, sessions, avgDuration, bounceRate — agrupados por pagePath, mapeados para posts via slug
- Upsert em `site_analytics` e `post_analytics`

**Passo 9** — Cron diário registrado dentro de `analyticsWorker.js` no startup:
- Job Bull repetível: `{ repeat: { cron: '0 3 * * *' } }` (configurável via env var `GA4_SYNC_CRON`)
- Busca todos os sites com `ga_property_id` preenchido e `subscription_status = active`
- Executa `ga4Service.syncSiteMetrics()` para cada um, date range = ontem

---

## Fase 7D — Endpoints do Dashboard

**Passo 10** — `GET /api/sites/:siteId/analytics/overview` (default últimos 30 dias via query params `startDate`/`endDate`)

Resposta:
```json
{
  "visitsTrend": [{ "date": "2026-04-01", "sessions": 123 }],
  "totals": {
    "sessions": 3800,
    "users": 2100,
    "newUsers": 1400,
    "avgSessionDurationSeconds": 142,
    "bounceRate": 0.54,
    "totalCtaClicks": 87
  },
  "topPosts": [{ "postId": "...", "title": "...", "pageviews": 420, "conversionRate": 0.03 }],
  "topPostsByConversion": [{ "postId": "...", "title": "...", "ctaClicks": 18, "pageviews": 210, "conversionRate": 0.086 }],
  "topCategories": [{ "categoryId": "...", "name": "...", "pageviews": 900 }],
  "editorialVelocity": 6,
  "newVsReturning": { "newUsers": 1400, "returningUsers": 700 }
}
```

**Conversão** = `count(analytics_events WHERE event_type='cta_click' AND post_id=X) ÷ sum(post_analytics.pageviews)` para o date range selecionado

**Passo 11** — `GET /api/sites/:siteId/analytics/posts`
- Lista paginada de posts com: pageviews, sessions, avgDuration, bounceRate, ctaClicks, conversionRate

**Passo 12** — `GET /api/sites/:siteId/analytics/categories`
- Top categorias por soma de pageviews dos seus posts, paginado

---

## Fase 7E — Site-Template: Tracking de Cliques em CTAs

**Passo 13** — `apps/site-template/lib/analytics.ts`

```ts
export function trackEvent(
  siteId: string,
  eventType: string,
  payload?: Record<string, unknown>
) {
  try {
    const body = JSON.stringify({ siteId, eventType, ...payload });
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/events`;
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(url, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } });
    }
  } catch {
    // fire-and-forget: never throw, never block navigation
  }
}
```

**Passo 14** — Atualizar componentes de CTA:
- `components/CTABanner.tsx` — `onClick={() => trackEvent(site.id, 'cta_click', { postId })}`
- `components/PostCTA.tsx` — idem
- `siteId` e `postId` recebidos via props das páginas

---

## Fase 7F — Backoffice

**Passo 15** — Formulário de settings do site (`/sites/[siteId]/settings`)
- Adiciona campo `ga_property_id` (label: "GA4 Property ID")
- Painel colapsável **"Como configurar o Google Analytics"** com o guia passo a passo (ver seção abaixo)

**Passo 16** — Nova página `apps/backoffice/app/(dashboard)/sites/[siteId]/analytics/page.tsx`:
- **Seletor de período**: tabs 7d / 30d / 90d (padrão 30d)
- **Cards KPI**: Total de Sessões, Usuários, Cliques em CTA, Duração Média, Taxa de Rejeição, Posts Publicados no Período
- **Gráfico de linha**: Sessões ao longo do tempo (Recharts)
- **Donut**: Novos vs Recorrentes
- **Top 10 Posts por Visualizações** (tabela com conv. rate) + botão "Ver mais" → `/analytics/posts`
- **Top 5 Posts por Conversão** (CTA clicks ÷ views) + botão "Ver mais"
- **Top 5 Categorias** (gráfico de barras horizontal)
- **Mini-stat**: posts publicados no período (editorial velocity)

**Passo 17** — Nova sub-página `apps/backoffice/app/(dashboard)/sites/[siteId]/analytics/posts/page.tsx`:
- Tabela paginada completa: título do post, pageviews, sessões, duração média, bounce rate, cliques CTA, taxa de conversão

---

## Guia de Setup do Google Analytics (exibido no backoffice)

1. Acesse [analytics.google.com](https://analytics.google.com), crie ou selecione uma propriedade GA4, copie o **Measurement ID** (`G-XXXXXXXX`) e cole no campo **"GA Tracking ID"** nas configurações do site.
2. Em **Admin → Property Settings**, anote o **Property ID** (número inteiro, ex: `123456789`) e cole no campo **"GA4 Property ID"**.
3. Acesse [console.cloud.google.com](https://console.cloud.google.com), crie um projeto e ative a **"Google Analytics Data API"** ([biblioteca de APIs](https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com)).
4. Em **IAM & Admin → Service Accounts** → crie uma conta de serviço → gere uma chave JSON → faça o download. ([Documentação](https://cloud.google.com/iam/docs/service-accounts-create))
5. De volta no GA: **Admin → Property Access Management** → adicione o e-mail da conta de serviço com o papel **"Viewer"**. ([Documentação](https://support.google.com/analytics/answer/9305587))
6. Entregue o arquivo JSON para o seu administrador de infraestrutura configurar a variável de ambiente `GOOGLE_APPLICATION_CREDENTIALS_JSON` (valor = conteúdo do JSON em base64).

---

## Setup em Produção

### Variáveis de ambiente adicionais (analytics worker)
```
GOOGLE_APPLICATION_CREDENTIALS_JSON=<base64 do JSON da conta de serviço>
GA4_SYNC_CRON=0 3 * * *   # opcional, padrão: 3h UTC
```

### Processos / containers
O `analyticsWorker` deve rodar como processo separado, junto com `buildWorker` e `aiWorker`. Adicionar ao `Dockerfile.worker`:

```dockerfile
# entry point alternativo para o analytics worker
CMD ["node", "src/workers/analyticsWorker.js"]
```

Ou via `docker-compose.yml`, adicionando um serviço:
```yaml
analytics-worker:
  build:
    context: ./apps/api
    dockerfile: Dockerfile.worker
  command: node src/workers/analyticsWorker.js
  env_file: .env
  depends_on:
    - postgres
    - redis
```

### Cron job (registrado via Bull no startup do worker)
Não é necessário cron externo (crontab, AWS EventBridge etc.). O Bull registra o job repetível quando o worker inicializa. Basta garantir que o `analyticsWorker` esteja sempre em execução.

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---|---|
| `apps/api/migrations/009-add-ga-property-id-to-sites.js` | Criar |
| `apps/api/migrations/010-create-analytics-tables.js` | Criar |
| `apps/api/src/models/AnalyticsEvent.js` | Criar |
| `apps/api/src/models/PostAnalytics.js` | Criar |
| `apps/api/src/models/SiteAnalytics.js` | Criar |
| `apps/api/src/models/index.js` | Atualizar associações |
| `apps/api/src/services/analyticsQueue.js` | Criar |
| `apps/api/src/services/ga4Service.js` | Criar |
| `apps/api/src/routes/analytics.js` | Criar |
| `apps/api/src/workers/analyticsWorker.js` | Criar |
| `apps/api/src/app.js` | Registrar rota `/api/analytics` |
| `apps/site-template/lib/analytics.ts` | Criar |
| `apps/site-template/components/CTABanner.tsx` | Adicionar onClick tracking |
| `apps/site-template/components/PostCTA.tsx` | Adicionar onClick tracking |
| `apps/backoffice/app/(dashboard)/sites/[siteId]/analytics/page.tsx` | Criar |
| `apps/backoffice/app/(dashboard)/sites/[siteId]/analytics/posts/page.tsx` | Criar |
| `apps/backoffice/lib/api.ts` | Adicionar chamadas de API de analytics |

---

## Decisões de Implementação

- **Fire-and-forget**: `sendBeacon` primário, `fetch({keepalive:true})` fallback, `try/catch` silencioso — zero impacto na UI, zero bloqueio de navegação
- **Auth GA4**: JSON da conta de serviço em base64 numa env var (sem montagem de arquivo em containers)
- **Cron**: Bull repeatable job registrado no startup do worker — nenhum daemon externo necessário
- **Conversão**: `count(analytics_events, cta_click, post_id) ÷ sum(post_analytics.pageviews)` para o date range selecionado
- **IP** armazenado em `analytics_events` para deduplicação/filtragem de abuso — nunca exposto nas respostas da API

---

## Checklist de Verificação

- [ ] Publicar um post, clicar em CTA no site estático → confirmar linha em `analytics_events`
- [ ] Desabilitar rede durante o clique → nenhum erro JS, nenhuma navegação bloqueada
- [ ] `POST /api/analytics/events` responde < 50ms e retorna 202
- [ ] Disparar job `ga-sync` manualmente → confirmar linhas em `post_analytics` e `site_analytics`
- [ ] Carregar `/sites/:id/analytics` no backoffice → todos os gráficos e cards renderizam sem erro
