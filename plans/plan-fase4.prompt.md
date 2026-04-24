## Plan: Fase 4 — Landing Page (Next.js SSG)

A landing page de conversão será um projeto Next.js 14 separado em `apps/landing/`, com `output: 'export'` para geração estática. O fluxo principal é: visitante lê a LP → preenche cadastro → recebe `accessToken` via `POST /api/auth/register` → chama `POST /api/payment/checkout` → redireciona para Stripe Checkout → Stripe redireciona para `FRONTEND_URL/payment-pending` (backoffice).

**Steps**

1. Criar `apps/landing/` com `create-next-app --typescript` e configurar `next.config.mjs` com `output: 'export'` e `trailingSlash: true` para geração estática pura.

2. Instalar dependências: `axios`, `react-hook-form`, `@hookform/resolvers`, `zod`, `lucide-react`, `clsx`, `tailwind-merge`. Configurar Tailwind CSS + PostCSS + `globals.css`. Definir variáveis CSS para a paleta de cores da plataforma.

3. Criar componentes de seção em `app/components/sections/`:
   - `Hero` — headline, subheadline, CTA "Comece agora" (ancora para `#register`)
   - `Features` — grid com os diferenciais da plataforma (sites estáticos, editor rico, SEO, domínio, pagamentos)
   - `Pricing` — card de plano único MVP com lista de features e CTA "Assinar agora" (ancora para `#register`)
   - `FAQ` — accordion com perguntas frequentes
   - `Footer` — links simples

4. Criar `app/components/RegisterForm.tsx` com `id="register"`:
   - Campos: nome, e-mail, senha (com validação Zod)
   - `onSubmit`: `POST /api/auth/register` → obtém `accessToken` → armazena em `localStorage` → `POST /api/payment/checkout` com `Authorization: Bearer <token>` → redireciona para `data.url` (Stripe Checkout)
   - Estados de loading e erro visíveis no formulário
   - `NEXT_PUBLIC_API_URL` via variável de ambiente (`.env.local`)

5. Criar `app/page.tsx` montando todas as seções em ordem: `<Hero>`, `<Features>`, `<Pricing>`, `<FAQ>`, `<RegisterForm>`, `<Footer>`. Configurar metadados (`title`, `description`, `og:image`) via `export const metadata`.

6. Criar `apps/landing/.env.example` com `NEXT_PUBLIC_API_URL=http://localhost:3001`.

7. Adicionar o serviço `landing` ao `docker-compose.yml` (opcional para dev local, similar ao backoffice) e documentar os comandos `npm run dev` / `npm run build` no README.

**Verification**

- `npm run build` em `apps/landing/` produz pasta `out/` com HTML estático sem erros
- Fluxo completo local: preencher formulário → receber redirect para URL do Stripe (em modo teste)
- `NEXT_PUBLIC_API_URL` apontando para a API local com Stripe test keys
- Verificar que a página estática carrega corretamente sem JavaScript desabilitado (conteúdo visível no HTML inicial)

**Decisions**
- O `accessToken` é armazenado em `localStorage` apenas temporariamente para a chamada ao `/checkout`; o backoffice usa o fluxo de `refreshToken` em cookie `httpOnly` — as duas apps são independentes
- Não há estado de sessão persistente na landing page; o fluxo é fire-and-forget (cadastro → Stripe)
- As âncoras `#register` e `#pricing` substituem navegação entre páginas (LP é single-page)
