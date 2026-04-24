## Plan: Fase 2 — Pagamento com Stripe

Integrar o Stripe Checkout para ativação de conta. O fluxo é: usuário `pending` inicia uma sessão de checkout → Stripe redireciona ao backoffice → webhook confirma o pagamento e muda `subscriptionStatus` para `active` → rotas protegidas passam a ser acessíveis.

**Steps**

1. Instalar dependência `stripe` em [apps/api/package.json](apps/api/package.json) via `npm install stripe`

2. Adicionar scripts em [apps/api/package.json](apps/api/package.json) na seção `"scripts"` para facilitar a validação local dos webhooks:
   - `"stripe:listen"`: `"stripe listen --forward-to localhost:3000/api/payment/webhook"` — inicia o Stripe CLI em modo escuta, imprime o `STRIPE_WEBHOOK_SECRET` temporário no terminal e encaminha eventos para a API local
   - `"stripe:trigger:checkout"`: `"stripe trigger checkout.session.completed"` — dispara um evento de checkout concluído para testar o handler do webhook
   - `"stripe:trigger:subscription:updated"`: `"stripe trigger customer.subscription.updated"` — útil para simular mudanças de status de assinatura no futuro

   Exemplo resultante no `package.json`:
   ```json
   "stripe:listen": "stripe listen --forward-to localhost:3000/api/payment/webhook",
   "stripe:trigger:checkout": "stripe trigger checkout.session.completed",
   "stripe:trigger:subscription:updated": "stripe trigger customer.subscription.updated"
   ```
   > **Nota:** esses scripts exigem o [Stripe CLI](https://stripe.com/docs/stripe-cli) instalado e autenticado (`stripe login`) na máquina do desenvolvedor. Documentar isso no `README.md`.

3. Adicionar variáveis de ambiente em `.env.example`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` (ID do plano recorrente no Stripe), `FRONTEND_URL` (para URLs de redirect do checkout)

4. Criar [apps/api/src/services/stripeService.js](apps/api/src/services/stripeService.js) que expõe:
   - `createCustomer(email, name)` → retorna `stripeCustomerId`
   - `createCheckoutSession(stripeCustomerId, userId)` → retorna `sessionUrl`; configura `success_url` e `cancel_url` apontando para o backoffice; inclui `client_reference_id: userId` para correlacionar no webhook

5. Criar [apps/api/src/routes/payment.js](apps/api/src/routes/payment.js) com dois endpoints:
   - `POST /checkout` — protegido por `auth`; cria ou reutiliza o `stripeCustomerId` do usuário (atualiza na tabela se ainda não existir), chama `stripeService.createCheckoutSession`, retorna `{ url }`
   - `POST /webhook` — **público**, sem `auth`; usa `express.raw()` (body parser especial necessário para validar a assinatura Stripe) e `stripe.webhooks.constructEvent` para verificar `STRIPE_WEBHOOK_SECRET`; no evento `checkout.session.completed` atualiza `subscriptionStatus = 'active'` pelo `client_reference_id` (userId)

6. Registrar as rotas em [apps/api/src/app.js](apps/api/src/app.js):
   - Montar `/api/payment/webhook` **antes** do `express.json()` global (o webhook precisa do body cru — `express.raw({ type: 'application/json' })`)
   - Montar `/api/payment` com `express.json()` para as demais rotas

7. Criar [apps/api/src/middlewares/subscription.js](apps/api/src/middlewares/subscription.js): verifica se `req.user.subscriptionStatus === 'active'`; caso contrário responde `403` com mensagem adequada. Se o `subscriptionStatus` não vier no token (caso do `/refresh`), faz uma consulta ao banco para obter o valor atual

8. Corrigir o endpoint `POST /refresh` em [apps/api/src/routes/auth.js](apps/api/src/routes/auth.js) para incluir `subscriptionStatus` no payload do novo access token, garantindo que após o pagamento o frontend possa obter um token válido sem novo login

9. Aplicar o middleware `subscription` em [apps/api/src/app.js](apps/api/src/app.js) nas rotas que exigem conta ativa: `/api/sites`, `/api/sites/:siteId/categories`, `/api/sites/:siteId/posts`, `/api/sites/:siteId/social-links`, `/api/upload`

10. Adicionar testes de integração em [apps/api/tests/integration.test.js](apps/api/tests/integration.test.js) cobrindo:
   - `POST /api/payment/checkout` com usuário `pending` → retorna URL
   - `POST /api/payment/webhook` com evento simulado `checkout.session.completed` → usuário fica `active`
   - Rota protegida com usuário `pending` → `403`
   - Rota protegida com usuário `active` → passa

**Verification**

- Em um terminal, rodar `npm run stripe:listen` em `apps/api/` — copiar o `whsec_...` exibido e definir como `STRIPE_WEBHOOK_SECRET` no `.env`
- Em outro terminal, rodar `npm run stripe:trigger:checkout` para disparar o evento e confirmar que o usuário tem `subscriptionStatus` atualizado para `active` no banco
- Rodar `npm test` em `apps/api/` para validar os testes de integração

**Decisions**

- Webhook usa `client_reference_id` em vez de metadata para correlacionar o `userId`, pois é campo nativo do Checkout Session e mais confiável
- O middleware `subscription` consulta o banco como fallback se o token não tiver `subscriptionStatus` (cobre tokens emitidos pelo `/refresh` antes da correção)
- Stripe Subscription (recorrente mensal) conforme já decidido no plano geral; o `STRIPE_PRICE_ID` referencia o preço recorrente criado no painel do Stripe
