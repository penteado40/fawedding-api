# FAWedding API

API REST para o ecossistema **FAWedding** — centraliza dados e regras do site de casamento: convidados, RSVP, lista de presentes, mensagens aos noivos e área administrativa.

## Stack

| Camada | Tecnologia |
|--------|------------|
| HTTP | Hono |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL + Prisma |
| Validação | Zod + `@hono/zod-validator` |
| Documentação | hono-openapi + zod-openapi + Scalar |
| Infra local | Docker |

---

## Instalação e setup local

### Pré-requisitos

- Node.js
- Docker e Docker Compose

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/fawedding-api.git
cd fawedding-api
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações (veja a seção [Variáveis de ambiente](#variáveis-de-ambiente)).

### 3. Suba o banco de dados

```bash
docker compose up -d
```

### 4. Instale as dependências

```bash
npm install
```

### 5. Execute as migrations

```bash
npx prisma migrate dev
```

### 6. Crie o primeiro token de autenticação

```bash
npm run seed:token
```

> Guarde o token exibido no console — ele é necessário para autenticar as requisições. Não será exibido novamente.

### 7. Inicie o servidor

```bash
npm run dev
```

A API estará disponível em `http://localhost:3000/api`.
A documentação interativa (Scalar) estará disponível em `http://localhost:3000/api/docs`.

---

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão com o PostgreSQL (ex: `postgresql://user:pass@localhost:5432/fawedding`) |

---

## Arquitetura

```
Cliente
  └── src/index.ts         # Middlewares, onError, app.route
        └── src/routes/    # Reexport dos controllers
              └── src/controllers/   # Rotas Hono + OpenAPI
                    └── src/services/        # Regras de negócio + Prisma
                          └── src/schemas/   # Validação Zod
                          └── src/models/    # Tipos e mappers
```

### Estrutura de pastas

```
src/
├── index.ts              # Entry point: middlewares, docs, onError, rotas
├── server.ts
├── controllers/          # *.controller.ts — rotas Hono com describeRoute e validator
├── services/             # *.service.ts — regras de negócio e acesso ao banco via Prisma
├── schemas/              # *.schema.ts — contratos Zod + OpenAPI
├── models/               # *.model.ts — tipos inferidos e mappers (toXResponse)
├── routes/               # *.routes.ts — reexport dos controllers + barrel index.ts
├── core/                 # Classes base (ex: AbstractService)
├── lib/                  # Prisma client, OpenAPI, docs
├── types/                # Tipos globais do Hono (AppEnv, ApplicationVariables)
└── utils/                # Utilitários compartilhados
```

### Convenções

- Respostas de sucesso: `{ "data": ... }`
- Respostas de erro: `{ "errors": "..." }`
- URLs em inglês, substantivos no plural: `/guests`, `/gifts`, `/messages`
- JSON em camelCase
- Lógica de negócio e Prisma exclusivamente nos services
- Controllers finos: apenas validação, chamada ao service e retorno

---

## Autenticação

A API utiliza Bearer token estático validado a cada requisição contra a tabela `api_tokens` no banco.

```http
Authorization: Bearer <token>
```

Rotas públicas (sem autenticação):
- `GET /api/openapi`
- `GET /api/docs`

---

## Endpoints

### API Tokens — `/api/api-tokens`

| Método | Rota | Descrição | Retorna token? |
|--------|------|-----------|----------------|
| `GET` | `/api/api-tokens` | Lista todos os tokens | Sim |
| `POST` | `/api/api-tokens` | Cria um novo token | Sim |
| `GET` | `/api/api-tokens/:id` | Busca token por ID | Não |
| `PUT` | `/api/api-tokens/:id` | Atualiza token | Não |
| `DELETE` | `/api/api-tokens/:id` | Remove token | Não |

> O campo `token` só é retornado na criação (`POST`). Guarde-o imediatamente.

**Exemplo — criar token:**

```bash
curl -X POST http://localhost:3000/api/api-tokens \
  -H "Authorization: Bearer <token-existente>" \
  -H "Content-Type: application/json" \
  -d '{"name": "frontend"}'
```

---

> A documentação completa e interativa de todos os endpoints está disponível em `/api/docs` (Scalar).

---

## Licença

Projeto pessoal. Todos os direitos reservados.