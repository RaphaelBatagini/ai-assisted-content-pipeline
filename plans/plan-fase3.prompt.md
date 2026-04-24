# Fase 3 — Backoffice (Next.js 14 App Router)

O backoffice é um SPA autenticado construído com Next.js 14 (App Router), Tailwind CSS e shadcn/ui. Consome a API REST já implementada via fetch/TanStack Query. O access token fica em memória (via Context) e o refresh token em cookie `httpOnly` gerenciado pela API.

## Steps

1. **Setup do projeto** — criar `apps/backoffice/` com `create-next-app` (App Router, TypeScript, Tailwind). Instalar dependências: `shadcn/ui`, `@tanstack/react-query`, `react-hook-form`, `zod`, `@tiptap/react` + extensões essenciais, `axios` como http client

2. **Camada de API client** — criar `src/lib/api.ts` com instância http configurada (base URL da API via env, interceptors para injetar `Authorization: Bearer <token>` e fazer refresh automático via `POST /api/auth/refresh` quando receber 401)

3. **AuthContext + middleware de rotas** — `src/context/AuthContext.tsx` armazena o access token e dados do usuário em memória; `src/middleware.ts` redireciona rotas protegidas para `/login` se não houver sessão; redireciona usuário `pending` para `/payment-pending`

4. **Layout raiz e layouts aninhados**
   - `app/layout.tsx` — providers (QueryClientProvider, AuthProvider, Toaster)
   - `app/(auth)/layout.tsx` — layout centralizado para login/register
   - `app/(dashboard)/layout.tsx` — sidebar + topbar; sidebar com links para sites

5. **Telas de autenticação**
   - `app/(auth)/login/page.tsx` — form com `email` + `password`; chama `POST /api/auth/login`; salva token no AuthContext
   - `app/(auth)/register/page.tsx` — form com `name`, `email`, `password`; chama `POST /api/auth/register`; redireciona para Stripe Checkout via `POST /api/payment/checkout`

6. **Tela de pagamento pendente** — `app/(auth)/payment-pending/page.tsx` — mensagem de status + botão "Fazer pagamento" que chama `POST /api/payment/checkout` e redireciona; polling opcional no `subscriptionStatus` via `useQuery` com `refetchInterval`

7. **Dashboard — lista de sites** — `app/(dashboard)/dashboard/page.tsx` — cards com nome e slug de cada site; botão "Novo site" leva para `/sites/new`

8. **Criação de site** — `app/(dashboard)/sites/new/page.tsx` — formulário em múltiplos steps ou seção única com: `name`, `slug` (gerado automaticamente a partir do nome, editável), `contactEmail`, `colorPalette` (seletor visual das 8 paletas), `logoUrl`, `faviconUrl`, `whatsapp`, `address`; chama `POST /api/sites`

9. **Settings do site** — `app/(dashboard)/sites/[siteId]/settings/page.tsx` — mesmo formulário do passo anterior (pré-preenchido), mais seções: SEO (`gaTrackingId`, `gtmContainerId`, `fbPixelId`, `customHeadScripts`) e redes sociais (CRUD inline das `social_links` — plataforma + URL, com select das 8 plataformas suportadas). Chama `PUT /api/sites/:siteId` e `POST/PUT/DELETE /api/sites/:siteId/social-links`

10. **Gestão de categorias** — `app/(dashboard)/sites/[siteId]/categories/page.tsx` — tabela com nome e slug; drawer/modal com form de criação/edição; exclusão com confirmação. Usa `GET/POST/PUT/DELETE /api/sites/:siteId/categories`

11. **Listagem de posts** — `app/(dashboard)/sites/[siteId]/posts/page.tsx` — tabela com título, status (badge colorido), data de publicação e reading time; filtro por status (`draft`/`published`/`archived`); botão "Novo post"

12. **Editor de post** — `app/(dashboard)/sites/[siteId]/posts/new/page.tsx` e `app/(dashboard)/sites/[siteId]/posts/[postId]/edit/page.tsx` — editor TipTap com extensões: Bold, Italic, Heading (H1–H3), BulletList, OrderedList, Blockquote, Link, Image (upload via `POST /api/upload`, insere URL no conteúdo). Sidebar direita com: `excerpt`, `coverImageUrl` (upload), categorias (multi-select), SEO (`seoTitle`, `seoDescription`, `ogImageUrl`), status. Botão "Salvar rascunho" (`PUT /api/sites/:siteId/posts/:postId`) e "Publicar" (`PUT /api/sites/:siteId/posts/:postId/publish`)

13. **Componentes compartilhados** — `ImageUpload` (drag-and-drop + preview usando `POST /api/upload`), `SlugInput` (auto-gera slug a partir de outro campo, editável), `ColorPaletteSelect` (grid visual), `ConfirmDialog`, `DataTable` (wrapper de shadcn/ui Table com sort/filter)

14. **Variáveis de ambiente** — `NEXT_PUBLIC_API_URL` apontando para a API; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (se necessário no frontend)

## Verification

- Rodar `docker-compose up` (Postgres + Redis) + API local, apontar `NEXT_PUBLIC_API_URL`
- Fluxo completo: register → redirect Stripe (modo test) → webhook → login → criar site → criar categoria → criar e publicar post
- Verificar que usuário `pending` é bloqueado nas rotas do dashboard
- Verificar refresh automático do access token (expiração curta de 15 min)

## Decisions

- **TanStack Query** para server state: cache automático, refetch, mutations com invalidation — elimina boilerplate de loading/error states
- **React Hook Form + Zod** para formulários: validação isomórfica alinhada ao Joi do backend
- **Access token em memória (Context)**: mais seguro que localStorage; refresh via cookie `httpOnly` já implementado na API
- **TipTap** conforme decidido no plano geral; extensão `Image` faz upload via `POST /api/upload` e insere a URL pública
