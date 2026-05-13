# Planejamento MVP — Ferramenta de Blogs

## Visão Geral

Plataforma SaaS multi-tenant para criação e gestão de blogs. Usuários contratam o serviço via landing page, pagam com cartão de crédito e gerenciam seus sites (posts, categorias, configurações) num backoffice. O conteúdo público de cada site é servido de forma **totalmente estática**, gerado sob demanda a cada alteração e distribuído via CDN.

---

## Arquitetura Geral

```
┌─────────────────────┐     ┌──────────────────────────┐     ┌─────────────────────┐
│  Landing Page (LP)  │     │   Backoffice (Next.js)   │     │  API (Node/Express) │
│  Next.js — SSG/SSR  │────▶│   Área autenticada SPA   │────▶│  REST + Auth JWT    │
└─────────────────────┘     └──────────────────────────┘     └────────┬────────────┘
                                                                       │
                                                              ┌────────▼────────────┐
                                                              │  PostgreSQL (DB)    │
                                                              └────────┬────────────┘
                                                                       │ evento de mudança
                                                              ┌────────▼────────────┐
                                                              │   Build Queue       │
                                                              │ (Bull + Redis)      │
                                                              └────────┬────────────┘
                                                                       │ dispara build
                                                              ┌────────▼────────────┐
                                                              │  Site Generator     │
                                                              │  (Next.js export    │
                                                              │   por tenant)       │
                                                              └────────┬────────────┘
                                                                       │ upload
                                                              ┌────────▼────────────┐
                                                              │  CDN / Object Store │
                                                              │  (S3 + CloudFront   │
                                                              │   ou similar)       │
                                                              └─────────────────────┘
```

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend API | Node.js 20 + Express 5 |
| Banco de dados | PostgreSQL 16 |
| ORM | Sequelize |
| Autenticação | JWT (access + refresh token) |
| Fila de builds | Bull (Redis) |
| Backoffice | Next.js 14 (App Router) |
| Landing Page | Next.js 14 (SSG) |
| Gerador de sites estáticos | Next.js `next export` por tenant |
| Hospedagem sites estáticos | AWS S3 + CloudFront (ou Vercel/Netlify por tenant) |
| Pagamento | Stripe (checkout + webhooks) |
| E-mail transacional | Resend ou SendGrid |
| Containerização | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## Modelo de Dados

### `users`
| Campo | Tipo | Obs |
|---|---|---|
| id | UUID PK | |
| name | varchar | |
| email | varchar unique | |
| password_hash | varchar | |
| stripe_customer_id | varchar | |
| subscription_status | enum: `pending` `active` `cancelled` | |
| created_at | timestamptz | |

### `sites`
| Campo | Tipo | Obs |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| name | varchar | Nome do blog |
| slug | varchar unique | Identificador da URL / subdomínio |
| color_palette | enum (ver paletas) | |
| logo_url | varchar nullable | |
| favicon_url | varchar nullable | |
| contact_email | varchar | |
| whatsapp | varchar nullable | |
| address | text nullable | |
| ga_tracking_id | varchar nullable | Google Analytics |
| gtm_container_id | varchar nullable | Google Tag Manager |
| fb_pixel_id | varchar nullable | Meta Pixel |
| custom_head_scripts | text nullable | Scripts extras |
| created_at | timestamptz | |

### `social_links`
| Campo | Tipo | Obs |
|---|---|---|
| id | UUID PK | |
| site_id | UUID FK → sites | |
| platform | enum: `instagram` `facebook` `twitter` `linkedin` `youtube` `tiktok` `pinterest` `other` | |
| url | varchar | |

### `categories`
| Campo | Tipo | Obs |
|---|---|---|
| id | UUID PK | |
| site_id | UUID FK → sites | |
| name | varchar | |
| slug | varchar | |
| description | text nullable | |

### `posts`
| Campo | Tipo | Obs |
|---|---|---|
| id | UUID PK | |
| site_id | UUID FK → sites | |
| author_id | UUID FK → users | |
| title | varchar | |
| slug | varchar | |
| excerpt | text nullable | Resumo / meta description |
| content | text | HTML ou Markdown |
| cover_image_url | varchar nullable | |
| status | enum: `draft` `published` `archived` | |
| published_at | timestamptz nullable | |
| seo_title | varchar nullable | |
| seo_description | varchar nullable | |
| og_image_url | varchar nullable | |
| reading_time_minutes | int nullable | Calculado no save |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `post_categories`
| Campo | Tipo |
|---|---|
| post_id | UUID FK |
| category_id | UUID FK |

### `contact_messages`
| Campo | Tipo | Obs |
|---|---|---|
| id | UUID PK | |
| site_id | UUID FK → sites | |
| name | varchar | |
| email | varchar | |
| message | text | |
| created_at | timestamptz | |

---

## Paletas de Cores Pré-definidas

Cada paleta define: `primary`, `secondary`, `accent`, `background`, `text`.

| Slug | Nome |
|---|---|
| `ocean` | Ocean Blue |
| `forest` | Forest Green |
| `sunset` | Sunset Orange |
| `midnight` | Midnight Dark |
| `lavender` | Lavender |
| `rose` | Rose Pink |
| `slate` | Slate Gray |
| `amber` | Amber Gold |

---

## Módulos do Backend (API)

### Autenticação — `POST /api/auth`
- `POST /register` — cria usuário com status `pending`
- `POST /login` — retorna access + refresh token
- `POST /refresh` — renova access token
- `POST /logout`

### Pagamento — `/api/payment`
- `POST /checkout` — cria sessão Stripe Checkout
- `POST /webhook` — recebe eventos Stripe; ativa `subscription_status = active`

### Sites — `/api/sites` _(requer subscription `active`)_
- `GET /` — lista sites do usuário autenticado
- `POST /` — cria site
- `GET /:siteId` — detalhe
- `PUT /:siteId` — atualiza
- `DELETE /:siteId`

### Categorias — `/api/sites/:siteId/categories`
- CRUD completo

### Posts — `/api/sites/:siteId/posts`
- CRUD completo
- `PUT /:postId/publish` — muda status para `published`, enfileira build

### Upload de Mídia — `/api/upload`
- `POST /` — upload para S3, retorna URL pública

### Contato — `/api/contact`
- `POST /` — público; salva mensagem, dispara e-mail para `contact_email` do site

### Redes Sociais — `/api/sites/:siteId/social-links`
- CRUD completo

---

## Frontend — Landing Page

Páginas (Next.js SSG):

1. **Hero** — proposta de valor, CTA "Comece agora"
2. **Features** — benefícios da plataforma
3. **Pricing** — plano único MVP
4. **FAQ**
5. **Formulário de cadastro** — nome, e-mail, senha → `POST /api/auth/register`
6. **Redirect para Stripe Checkout** — após cadastro

---

## Frontend — Backoffice

Fluxo de acesso:
- Usuário com status `pending` vê apenas a tela de pagamento pendente
- Usuário com status `active` acessa o dashboard completo

Páginas:
- `/login`, `/register`
- `/payment-pending` — status do pagamento
- `/dashboard` — visão geral dos sites
- `/sites/new` — criação de site
- `/sites/[siteId]/settings` — nome, paleta, SEO, integrações, redes sociais, endereço, WhatsApp
- `/sites/[siteId]/categories` — listagem + formulário
- `/sites/[siteId]/posts` — listagem com status
- `/sites/[siteId]/posts/new` — editor de post rico (TipTap ou similar)
- `/sites/[siteId]/posts/[postId]/edit`

**Segurança:** todas as chamadas de API incluem o JWT; o backend valida que o `siteId` pertence ao usuário autenticado antes de qualquer operação.

---

## Geração de Sites Estáticos

### Estratégia

Cada tenant possui um domínio/subdomínio isolado (ex: `meu-blog.plataforma.com` ou domínio próprio apontado via CNAME). O conteúdo é gerado como HTML estático e servido por CDN — sem servidor de aplicação exposto aos visitantes.

### Fluxo de Build por Tenant

```
1. Usuário salva/publica conteúdo no backoffice
2. API enfileira job no Bull: { siteId, trigger: 'content_change' }
3. Worker consome a fila:
   a. Busca dados do site + posts publicados + categorias no banco
   b. Escreve arquivos JSON em /tmp/builds/<siteId>/data/
   c. Executa `next build && next export` no projeto site-template/
      com variável SITE_ID=<siteId>
   d. Faz upload da pasta `out/` para S3: s3://sites-estaticos/<siteId>/
   e. Invalida cache do CloudFront para o distribution do tenant
4. Site estático atualizado em ~60s após a publicação
```

### Projeto `site-template`

- Next.js com `output: 'export'`
- Consome os JSONs pré-gerados (sem chamadas ao banco em runtime)
- Paletas de cores aplicadas via CSS custom properties
- Páginas geradas: `/`, `/[categorySlug]`, `/post/[postSlug]`, `/contato`
- Scripts de SEO (GA, GTM, Pixel) injetados via variáveis do site
- Sitemap e `robots.txt` gerados automaticamente

### Isolamento de Tenants na CDN

**Opção A — Subdomain wildcard** _(MVP recomendado)_
- `*.plataforma.com` → Wildcard CNAME → CloudFront Distribution único
- Lambda@Edge lê o `Host` header e serve o prefixo S3 correto (`/siteSlug/`)

**Opção B — Distribution dedicado por tenant** _(pós-MVP)_
- Criado via AWS SDK no momento do cadastro do site
- Permite domínio customizado com certificado SSL via ACM
- Maior custo e complexidade operacional

### CI/CD do Site Generator

Pipeline GitHub Actions:
- Push na branch `main` do projeto `site-generator` → build + push da imagem Docker para ECR
- Worker (ECS Fargate ou EC2) faz pull da nova imagem automaticamente
- Nenhuma intervenção manual para atualizar o template de todos os sites

---

## Estrutura do Monorepo

```
/
├── apps/
│   ├── api/              # Node.js + Express (models, migrations, workers)
│   ├── backoffice/       # Next.js (App Router) — área autenticada
│   ├── landing/          # Next.js (SSG) — LP de conversão
│   └── site-template/    # Next.js export — template dos sites dos tenants
├── docker-compose.yml
└── plan.md
```

---

## Segurança e Multi-tenancy

- Toda query ao banco filtra por `user_id` ou valida que o `site_id` pertence ao usuário (middleware dedicado por rota)
- JWT com expiração curta (15 min) + refresh token rotativo armazenado em cookie `httpOnly`
- Rate limiting por IP nas rotas públicas (contato, auth)
- Upload de mídia: validação de MIME type + limite de tamanho; arquivos isolados por `userId/siteId/` no S3
- Stripe Webhook validado via `stripe-signature`
- Variáveis sensíveis via `.env` em desenvolvimento e AWS Secrets Manager em produção

---

## Tarefas por Fase

### Fase 0 — Infraestrutura Base
- [x] Criar estrutura `apps/`
- [x] Docker Compose local (PostgreSQL, Redis)
- [x] Setup Sequelize com models iniciais e primeira migration dentro de `apps/api/`
- [x] Configuração de variáveis de ambiente (`.env.example`)

### Fase 1 — Backend Core
- [x] Autenticação JWT (register, login, refresh, logout)
- [x] Middleware de validação de ownership (`siteId` pertence ao usuário)
- [x] CRUD de Sites
- [x] CRUD de Categorias
- [x] CRUD de Posts (incluindo ação de publicação)
- [x] CRUD de Redes Sociais
- [x] Upload de mídia para S3
- [x] Rota pública de contato + envio de e-mail
- [x] Testes de integração das rotas principais

### Fase 2 — Pagamento
- [x] Integração Stripe Checkout (criação de sessão)
- [x] Webhook para ativar conta (`subscription_status = active`)
- [x] Middleware de verificação de subscription nas rotas protegidas

### Fase 3 — Backoffice
- [x] Setup Next.js 14 + shadcn/ui + Tailwind CSS
- [x] Telas de autenticação (login, register)
- [x] Tela de pagamento pendente com botão de retry
- [x] Dashboard de sites
- [x] Formulário de criação/edição de site (paleta, SEO, integrações, redes sociais, endereço)
- [x] Gestão de categorias
- [x] Listagem de posts com filtro por status
- [x] Editor de post rico (TipTap) com upload de imagem inline

### Fase 4 — Landing Page
- [x] Design e conteúdo da LP (SSG)
- [x] Integração com fluxo de cadastro → Stripe Checkout

### Fase 5 — Site Generator Estático
- [x] Projeto `site-template` base (Next.js export com páginas essenciais)
- [x] Worker Bull para consumo da fila de builds
- [x] Script de upload para S3 + invalidação de cache CloudFront
- [x] Wildcard subdomain na CDN com Lambda@Edge
- [x] Testes end-to-end do fluxo publicação → site ao vivo

### Fase 6 — Agentes de IA
- [x] **Infraestrutura base dos agentes**: setup de SDK (LangChain ou similar), gerenciamento de contexto de marca (tom de voz, palavras-chave) por site
- [x] **Agente Roadmap de Conteúdo**: pesquisa tópicos em alta (via Google Trends API ou similar), cruza com categorias do site e gera lista priorizada de temas para o próximo ciclo
- [x] Endpoint `POST /api/sites/:siteId/ai/roadmap` — aciona o agente e retorna lista de temas sugeridos
- [x] Tela no backoffice para visualizar e aprovar temas do roadmap, adicionando-os à fila de produção
- [x] **Agente de Redação**: dado um tema aprovado, realiza pesquisa aprofundada, redige o rascunho do post com citação de fontes, e incorpora dados de performance dos posts anteriores para ajustar abordagem e manter tom de voz da marca
- [x] Endpoint `POST /api/sites/:siteId/ai/draft` — recebe tema + contexto de marca e retorna rascunho em HTML/Markdown
- [x] Integração do rascunho gerado diretamente no editor TipTap do backoffice para revisão humana
- [ ] **Agente de Revisão de SEO**: analisa o rascunho final, sugere ajustes de título, meta description, densidade de palavras-chave, estrutura de headings e links internos
- [ ] Endpoint `POST /api/sites/:siteId/ai/seo-review` — recebe conteúdo do post e retorna lista de sugestões estruturadas
- [ ] Painel de revisão de SEO no editor de post com checklist interativo das sugestões do agente

### Fase 7 — Tracking e Analytics
- [x] Tracking de cliques em botões de conversão (CTA "entrar em contato") nos sites estáticos via eventos GA/GTM
- [x] Endpoint na API para receber e armazenar eventos de clique vindos do site-template (`POST /api/analytics/events`)
- [x] Integração com a API do Google Analytics (Data API) para coletar métricas de performance por post (pageviews, tempo médio, taxa de rejeição)
- [x] Armazenamento das métricas coletadas por post na tabela `post_analytics` (snapshot periódico via worker)
- [x] Tela no backoffice com painel de performance dos posts (visualizações, engajamento, conversões)

### Fase 8 — Agenda de Publicações
- [ ] Adicionar campo `scheduled_at` (timestamptz nullable) na tabela `posts`
- [ ] Adicionar status `scheduled` no enum de `posts.status`
- [ ] Endpoint `PUT /:postId/schedule` — define `scheduled_at` e muda status para `scheduled`
- [ ] Worker periódico (cron via Bull) que verifica posts com `scheduled_at <= now()` e os publica automaticamente
- [ ] Interface no backoffice para selecionar data/hora de publicação (dia da semana, dia do mês e horário)
- [ ] Listagem de posts agendados com opção de cancelar ou reagendar

### Fase 9 — Revisão e Continuidade da Grade de Conteúdo

#### Interação com a Grade Antes da Geração de Posts

- [ ] Adicionar campos `status` (`pending_review` | `approved` | `rejected`), `feedback` (text nullable) e `order` (int) na tabela `content_strategy_briefs` (ou criar tabela `roadmap_topics` com os mesmos campos + `brief_id` FK)
- [ ] Endpoint `GET /api/sites/:siteId/ai/roadmap/topics` — lista todos os tópicos da grade com status e metadados (título, descrição, palavras-chave, categoria sugerida)
- [ ] Endpoint `PUT /api/sites/:siteId/ai/roadmap/topics/:topicId` — edita título, descrição, palavras-chave ou categoria de um tópico ainda não escrito
- [ ] Endpoint `DELETE /api/sites/:siteId/ai/roadmap/topics/:topicId` — remove tópico da grade
- [ ] Endpoint `POST /api/sites/:siteId/ai/roadmap/regenerate` — recebe `{ feedback: string }` e regera a grade inteira incorporando o feedback; preserva tópicos já publicados ou em rascunho
- [ ] Endpoint `POST /api/sites/:siteId/ai/roadmap/approve` — marca a grade como aprovada e dispara a geração dos primeiros posts (N configurável, padrão 5)
- [ ] Tela no backoffice de "Revisão da Grade": lista de tópicos em cards editáveis inline (título, descrição, categoria, palavras-chave), com ações de remover e reordenar via drag-and-drop
- [ ] Campo de feedback em texto livre + botão "Regerar Grade" que exibe preview da nova grade antes de confirmar a substituição
- [ ] Botão "Aprovar Grade e Gerar Posts" — só habilitado após aprovação; dispara geração dos primeiros rascunhos em background e redireciona para a listagem de posts

#### Expansão Automática da Grade

- [ ] Adicionar campo `auto_expand_threshold` (float, padrão `0.8`) e `last_expanded_at` (timestamptz nullable) na tabela `sites`
- [ ] Worker periódico (cron via Bull, intervalo configurável, ex: diário) que, para cada site com grade ativa, calcula `ratio = tópicos_publicados / total_tópicos_não_rejeitados`; quando `ratio >= auto_expand_threshold`, enfileira job de expansão
- [ ] Job de expansão: chama o agente de roadmap passando o contexto da grade existente como referência, solicita N novos tópicos complementares (sem duplicar os já existentes) e os insere com status `pending_review`
- [ ] Notificação no backoffice (badge ou toast) informando que novos tópicos foram sugeridos e aguardam revisão
- [ ] Endpoint `GET /api/sites/:siteId/ai/roadmap/expansion-status` — retorna `ratio` atual, limiar configurado e data da última expansão
- [ ] Configuração no painel do site para ajustar `auto_expand_threshold` e habilitar/desabilitar a expansão automática

### Fase 10 — Deploy e Documentação
- [ ] Dockerfiles de produção para cada app
- [ ] Pipeline GitHub Actions (lint, test, build, deploy)
- [ ] Documentação de onboarding para novos desenvolvedores

---

## Decisões em Aberto

| Decisão | Opções | Recomendação MVP |
|---|---|---|
| Modelo de cobrança | Recorrente mensal / Pagamento único | Recorrente mensal (Stripe Subscription) |
| Domínios customizados | Subdomínio gratuito / CNAME próprio | Subdomínio gratuito no MVP |
| Editor de conteúdo | TipTap / Lexical / Editor.js | TipTap (melhor DX + extensões) |
| Exibição dos posts no frontend público | Fora do escopo MVP | Preparar template, não priorizar |
