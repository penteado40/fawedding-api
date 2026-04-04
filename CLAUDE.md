# FAWedding API — Contexto para o Claude Code

## Arquitetura de rules

| Arquivo | Escopo |
|---------|--------|
| `CLAUDE.md` (raiz) | **Sempre** — visão geral, stack, arquitetura, convenções globais e tratamento de erros |
| `src/CLAUDE.md` | `src/index.ts` e `src/routes/` — app Hono, middlewares, `startDocs`, `app.route`, reexports de controllers |
| `src/controllers/CLAUDE.md` | `src/controllers/**/*.ts` |
| `src/services/CLAUDE.md` | `src/services/**/*.ts` |
| `src/schemas/CLAUDE.md` | `src/schemas/**/*.ts` |
| `src/models/CLAUDE.md` | `src/models/**/*.ts` |

Pastas como `core/`, `lib/`, `types/`, `utils/` seguem esta rule até existir CLAUDE.md dedicado.

### Estrutura de pastas em `src/`

```
src/
  index.ts          # app Hono, middlewares, onError, app.route
  server.ts
  controllers/      # um ficheiro por recurso: *.controller.ts (rotas Hono + OpenAPI)
  services/         # *.service.ts (AbstractService + factories create*Service)
  schemas/          # *.schema.ts (Zod + contratos de request/response)
  models/           # *.model.ts (z.infer + mappers to*Response)
  routes/           # *.routes.ts (reexport de controllers) + index.ts (barrel)
  core/             # classes base (ex.: AbstractService)
  lib/              # prisma, openapi, docs
  types/            # env Hono (ApplicationVariables, AppEnv)
```

---

## Visão geral

API REST em **TypeScript** para o ecossistema **FAWedding**: centraliza dados e regras do site (convidados, RSVP, presentes, mensagens e admin futuro). Objetivo: um backend único, modular em camadas e fácil de manter.

## Domínio

- Casamento / site do casal
- Convidados e **RSVP**
- Lista de presentes e mensagens aos noivos
- Evolução para áreas administrativas (gestão protegida)

## Stack

| Camada | Tecnologia |
|--------|------------|
| HTTP | **Hono** (`Context` como `c`) |
| Linguagem | **TypeScript** |
| Dados | **PostgreSQL** + **Prisma** |
| Validação | **Zod**, **`@hono/zod-validator`** |
| Contrato / docs | **hono-openapi**, **zod-openapi**; referência visual (**Scalar**) quando configurado |
| Ambiente | **Docker** (banco local); **Node** para dev/build |

## Arquitetura (modular + camadas)

```
Cliente → index.ts (middlewares, docs, onError)
       → app.route → routes/ (reexport) → controllers/
       → services/ → models/ (mappers) + schemas/ (Zod)
```

- **`src/index.ts`:** wiring, não regra de negócio.
- **`src/routes/`:** reexport de controllers para `app.route` (e barrel `index.ts`).
- **`src/controllers/`:** instâncias `Hono`, `describeRoute`, `validator`, factories `create*Service(c)`.
- **`src/services/`:** regras de negócio e `this.prisma`.
- **`src/schemas/`:** Zod e OpenAPI.
- **`src/models/`:** `z.infer` e `to*Response`.
- **`core/`**, **`lib/`**, **`types/`**, **`utils/`:** infraestrutura e tipos compartilhados.

## Fluxo de requisição e erro

1. Request entra na app com **`/api`** (ou `basePath` definido).
2. Middlewares: contexto (ex.: Prisma), autenticação (ex.: **Clerk** ou outro middleware global), **CORS**.
3. Rota no controller: **`validator`** + handler; dados válidos via **`c.req.valid()`**.
4. Controller chama **`createXService(c)`** e retorna **`{ data }`** em sucesso.
5. Falhas: **services** (ou camadas inferiores) **lançam**; **`app.onError`** no `index.ts` formata **`{ errors }`** e status.

## Convenções gerais

| Tópico | Regra |
|--------|--------|
| JSON | **camelCase** |
| URLs | substantivos no **plural**, em **inglês** (`/guests`, `/venues`, …) |
| REST | Métodos e status HTTP com semântica usual |
| Sucesso | **`{ "data": … }`** |
| Erro | **`{ "errors": "…" }`** (global) |
| Multi-tenant | Filtrar por **`orgId`** nos services quando aplicável |

## Regras globais obrigatórias

- Tipar **`Hono`** com **`Bindings`** (ex.: `DATABASE_URL`) e **`Variables`** (ex.: prisma, user) quando o projeto exportar esses tipos.
- Toda rota com entrada HTTP: **`validator`** alinhado a **`schemas/`**.
- Toda rota documentada: **`describeRoute`** com **`summary`**, **`description`**, **`tags`**, **`mapResponses`**.
- Controllers finos; **Prisma** só em **services** (via **`this.prisma`**).
- Erros: **não** responder erro manualmente no controller; usar **`onError`**.
- Migrations e **schema Prisma** como fonte de verdade do banco.

## Anti-patterns (projeto)

- Lógica de negócio ou Prisma no **controller**.
- **`req.json()`** / query crua sem **`validator`**.
- **`try/catch` no controller** para montar corpo de erro.
- Resposta de sucesso ou erro **inconsistente** com `{ data }` / `{ errors }`.
- Rotas **sem** OpenAPI ou **sem** validação onde há entrada.
- **`app.route`** duplicado para o **mesmo** controller.

---

## Erros — tratamento global

Tratamento centralizado em **`app.onError`** no **`src/index.ts`**. Camadas superiores **lançam** erros; não duplicam resposta JSON manualmente.

### Tipos de erro

| Tipo | Origem típica |
|------|----------------|
| **`HTTPException`** | Hono / fluxo HTTP explícito (`throw new HTTPException(status, { message })`). |
| **`z.ZodError`** | Validação Zod fora do `validator` do Hono, ou `schema.parse` que deixa propagar. |
| **Erro genérico** | `Error` ou qualquer valor não mapeado (bugs, falhas Prisma não encapsuladas, etc.). |

### Resposta padrão

```json
{ "errors": "mensagem" }
```

Evitar formatos paralelos (`error`, `message`, objeto aninhado).

### Status codes

| Entrada | Status HTTP |
|---------|-------------|
| **`HTTPException`** | **`err.status`** (preservar o status original). |
| **`z.ZodError`** | **400**. |
| **Demais (default)** | **500**. |

### Implementação (`index.ts`)

```ts
app.onError(async (err, c) => {
  if (err instanceof HTTPException) {
    c.status(err.status)
    return c.json({ errors: err.message })
  }
  if (err instanceof z.ZodError) {
    c.status(400)
    return c.json({ errors: err.message })
  }
  c.status(500)
  return c.json({ errors: err.message })
})
```

### Regras de erro obrigatórias

- **`app.onError`** é a fonte da verdade para status + corpo de erro.
- **Services** podem lançar `HTTPException` ou `Error`; o handler global trata.
- **Controllers** não montam `c.json` de erro — só retornam sucesso ou deixam a exceção subir.
- **Nunca** engolir erro no service (`catch` vazio ou `null` sem motivo).
