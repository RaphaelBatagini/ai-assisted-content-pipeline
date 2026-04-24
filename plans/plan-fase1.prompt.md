## Plan: Fase 1 — Backend Core

A Fase 0 está completa: Express skeleton, todos os models Sequelize, migrations e Docker Compose funcionais. A Fase 1 implementa toda a camada de rotas, autenticação JWT e lógica de negócio da API.

---

**Pacotes a instalar**

Adicionar ao `apps/api/package.json`: `bcrypt`, `jsonwebtoken`, `cookie-parser`, `express-rate-limit`, `joi` (validação), `multer` + `@aws-sdk/client-s3` (upload), `resend` (e-mail), `uuid` já vem via Sequelize.

---

**Steps**

1. **Estrutura de pastas** — criar em `apps/api/src/`:
   - `middlewares/` — `auth.js`, `ownership.js`, `rateLimiter.js`
   - `routes/` — `auth.js`, `sites.js`, `categories.js`, `posts.js`, `socialLinks.js`, `upload.js`, `contact.js`
   - `services/` — `emailService.js`, `s3Service.js`
   - `validators/` — schemas Joi por recurso

2. **Registrar rotas no `app.js`** — montar todos os routers sob `/api/*`, adicionar `cookie-parser`

3. **Autenticação — `POST /api/auth/*`**
   - `register`: hash da senha com `bcrypt`, cria `User` com `subscriptionStatus: 'pending'`, retorna access token
   - `login`: valida credenciais, emite access token (JWT, 15 min, payload `{ userId, subscriptionStatus }`) + refresh token (7 dias, cookie `httpOnly`)
   - `refresh`: lê cookie refresh, verifica assinatura, emite novo access token
   - `logout`: limpa o cookie refresh

4. **Middleware `auth.js`** — extrai Bearer token do header `Authorization`, verifica com `jsonwebtoken`, injeta `req.user`

5. **CRUD de Sites — `/api/sites`** (requer `auth`)
   - `GET /` — `WHERE user_id = req.user.userId`
   - `POST /` — cria site vinculado ao usuário autenticado
   - `GET /:siteId`, `PUT /:siteId`, `DELETE /:siteId` — todos passam pelo middleware `ownership.js`

6. **Middleware `ownership.js`** — dado o param `siteId`, verifica `Site.findOne({ where: { id, userId } })`; 404 se não encontrar; injeta `req.site`

7. **CRUD de Categorias — `/api/sites/:siteId/categories`** — usa `req.site.id`; slug pode ser gerado a partir do `name` se não enviado

8. **CRUD de Posts — `/api/sites/:siteId/posts`**
   - Na criação/edição, calcula `readingTimeMinutes` (contagem de palavras ÷ 200)
   - `PUT /:postId/publish` — muda `status` para `published`, seta `publishedAt`; enfileirar build fica como `TODO` (Redis/Bull chegam na Fase 5)
   - Suporte a `categoryIds[]` no body para atualizar `PostCategory`

9. **CRUD de Redes Sociais — `/api/sites/:siteId/social-links`** — operações simples via `req.site`

10. **Upload de Mídia — `POST /api/upload`** (requer `auth`)
    - `multer` com `memoryStorage`, limite de 10 MB, validação de MIME (`image/*`)
    - `s3Service.js` usa `@aws-sdk/client-s3` (`PutObjectCommand`), chave `uploads/{userId}/{siteId}/{uuid}.ext`
    - Retorna `{ url }` público

11. **Contato público — `POST /api/contact`**
    - Sem autenticação; recebe `{ siteId, name, email, message }`
    - Rate limit por IP via `express-rate-limit` (ex: 5 req / 15 min)
    - Persiste `ContactMessage`, chama `emailService.js` (Resend) enviando para `site.contactEmail`

12. **Validação** — schemas Joi em `validators/`; middleware genérico `validate(schema)` retorna 400 com erros detalhados

13. **Tratamento de erros global** — middleware de erro no final do `app.js` capturando `ValidationError` do Sequelize e erros JWT

14. **Testes de integração** — instalar `jest` + `supertest`; testar fluxos críticos: register → login → create site → create post → publish; usar banco de teste via variável `NODE_ENV=test`

---

**Verificação**

- `npm run dev` na API sobe sem erros
- `npm test` passa nos testes de integração
- `GET /health` retorna `{ status: 'ok', db: 'connected' }`
- Fluxo completo via curl/Postman: register → login → criar site → criar post → publicar post

**Decisões**

- Refresh token armazenado apenas no cookie `httpOnly` (não persiste no banco no MVP — revogação não é necessária agora)
- Enfileiramento de build em `publish` fica como `TODO` comentado — Bull/Redis integrados na Fase 5
- Email real exige `RESEND_API_KEY` válida; em testes, o serviço de e-mail é mockado
