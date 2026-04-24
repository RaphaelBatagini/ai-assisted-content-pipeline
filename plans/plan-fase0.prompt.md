## Plan: Fase 0 — Infraestrutura Base

Configurar o esqueleto do projeto: estrutura de pastas, ambiente local containerizado, projeto Node.js/Express com Sequelize configurado e todas as migrations do modelo de dados definido no plan.md.

---

**Estrutura de arquivos a criar**

```
/
├── apps/
│   └── api/
│       ├── src/
│       │   ├── config/
│       │   │   └── database.js       # instância do Sequelize + config por env
│       │   ├── models/
│       │   │   ├── index.js          # carrega e associa todos os models
│       │   │   ├── User.js
│       │   │   ├── Site.js
│       │   │   ├── SocialLink.js
│       │   │   ├── Category.js
│       │   │   ├── Post.js
│       │   │   ├── PostCategory.js
│       │   │   └── ContactMessage.js
│       │   └── app.js                # Express bootstrap mínimo
│       ├── migrations/
│       │   ├── 001-create-users.js
│       │   ├── 002-create-sites.js
│       │   ├── 003-create-social-links.js
│       │   ├── 004-create-categories.js
│       │   ├── 005-create-posts.js
│       │   ├── 006-create-post-categories.js
│       │   └── 007-create-contact-messages.js
│       ├── .sequelizerc              # paths para migrations e models
│       ├── .env.example
│       ├── package.json
│       └── Dockerfile                # para uso futuro (Fase 6)
├── docker-compose.yml                # PostgreSQL 16 + Redis 7
└── plan.md
```

---

**Steps**

1. **Criar `docker-compose.yml`** na raiz com serviços `postgres` (imagem `postgres:16`, porta 5432, volume persistente) e `redis` (imagem `redis:7-alpine`, porta 6379)

2. **Inicializar `apps/api/package.json`** com dependências:
   - produção: `express`, `sequelize`, `pg`, `pg-hstore`, `dotenv`, `sequelize-cli`
   - dev: `nodemon`

3. **Criar `apps/api/.env.example`** com todas as variáveis necessárias:
   - `NODE_ENV`, `PORT`
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - `REDIS_URL`
   - (placeholders para fases futuras: `JWT_SECRET`, `STRIPE_SECRET_KEY`, `AWS_*`, `RESEND_API_KEY`)

4. **Criar `apps/api/.sequelizerc`** apontando paths para `src/config/database.js`, `src/models/`, `migrations/`

5. **Criar `apps/api/src/config/database.js`** com a instância Sequelize lendo variáveis do `.env`, com `dialect: 'postgres'` e `define: { underscored: true, timestamps: true }`

6. **Criar os 7 models** em `apps/api/src/models/` seguindo exatamente o modelo de dados do plan.md:
   - `User` — enums `subscription_status: ['pending', 'active', 'cancelled']`
   - `Site` — enum `color_palette` com as 8 paletas; FK para `User`
   - `SocialLink` — enum `platform`; FK para `Site`
   - `Category` — FK para `Site`
   - `Post` — enum `status: ['draft', 'published', 'archived']`; FKs para `Site` e `User`
   - `PostCategory` — tabela pivot sem timestamps
   - `ContactMessage` — FK para `Site`

7. **Criar `apps/api/src/models/index.js`** que carrega todos os models, define as associações (`User.hasMany(Site)`, `Site.hasMany(Post)`, `Post.belongsToMany(Category, { through: PostCategory })`, etc.) e exporta tudo

8. **Criar as 7 migrations** em `apps/api/migrations/` espelhando cada model com os tipos corretos do PostgreSQL (`UUID`, `ENUM`, `TEXT`, `TIMESTAMPTZ`), constraints de FK e índices em `slug` e `email`

9. **Criar `apps/api/src/app.js`** com Express mínimo (apenas health check `GET /health`) para validar que o servidor sobe e conecta ao banco

10. **Validar** subindo `docker compose up -d`, rodando `sequelize db:migrate` e verificando que todas as tabelas foram criadas corretamente

---

**Verification**

```bash
docker compose up -d
cd apps/api && npx sequelize-cli db:migrate
# esperado: 7 migrations executadas sem erro

node src/app.js
curl http://localhost:3000/health
# esperado: { "status": "ok", "db": "connected" }
```

---

**Decisions**

- Models com `underscored: true` — colunas em `snake_case` no banco, propriedades em `camelCase` no código
- UUIDs gerados pelo banco via `DEFAULT gen_random_uuid()` nas migrations (requer PostgreSQL 13+, disponível no 16)
- `sequelize-cli` incluído como dependência de produção para rodar migrations em deploy; não apenas devDependency
