# Landing Page — Blogs Tool

Landing page de conversão gerada estaticamente com Next.js 14 (`output: 'export'`).

## Pré-requisitos

- Node.js 20+
- API rodando em `http://localhost:3001` (ou configurar `NEXT_PUBLIC_API_URL`)

## Configuração

```bash
cp .env.example .env.local
# Edite .env.local com a URL da API
```

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build estático

```bash
npm run build
# A pasta out/ contém o HTML estático pronto para deploy
```

## Fluxo principal

1. Visitante lê a LP
2. Preenche o formulário de cadastro (`#register`)
3. `POST /api/auth/register` → recebe `accessToken`
4. `POST /api/payment/checkout` com `Authorization: Bearer <token>`
5. Redirecionado para o Stripe Checkout
6. Stripe redireciona para `FRONTEND_URL/payment-pending` (backoffice)

## Variáveis de ambiente

| Variável              | Descrição       | Padrão                  |
|-----------------------|-----------------|-------------------------|
| `NEXT_PUBLIC_API_URL` | URL base da API | `http://localhost:3001` |
