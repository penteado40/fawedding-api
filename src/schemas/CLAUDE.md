# Schemas — FAWedding API

**Path:** `src/schemas/**/*.ts`

Contratos de entrada/saída e documentação OpenAPI via **Zod**. Uma pasta/arquivo por entidade; nomes estáveis e reutilização entre `validator()`, `describeRoute` e services.

## Organização

Agrupar por **entidade**, com objeto único de requests por verbo/ação:

```ts
VenueRequestSchema.CREATE
VenueRequestSchema.UPDATE
GuestRequestSchema.SEARCH
VenueResponseSchema.COLLECTION
GuestResponseSchema.SINGLE
```

## Tipos de schema (obrigatórios por entidade exposta na API)

| Chave | Uso típico |
|-------|------------|
| **CREATE** | Body em `POST` |
| **GET** | Params (ex.: id) em `GET`/`DELETE` quando aplicável |
| **UPDATE** | Body em `PATCH`/`PUT` |
| **DELETE** | Params ou body mínimo para remoção |
| **SEARCH** | Query em listagens (`GET` com filtros) |
| **INCLUDES** | Flags de relacionamento (ex.: `?include=...`) |

## Validação (Zod)

- Preferir encadeamento explícito: `z.string().min(1).max(200)`, `z.number().int()`, etc.
- IDs: **`z.number().int()`** no model schema (resposta); **`z.coerce.number().int().positive()`** em params de rota (GET/DELETE) — path params chegam como string via HTTP e precisam de coerção.
- Campos opcionais/nulos: `.optional()`, `.nullable()`, conforme o modelo.

## Tipagem

```ts
type CreateGuestRequest = z.infer<typeof GuestRequestSchema.CREATE>
type GuestModel = z.infer<typeof GuestModelSchema>
```

**Sempre** usar **`z.infer<typeof ...>`** em cima do schema exportado.

## Reutilização

- Extrair blocos comuns em schemas base (`GuestBaseModelSchema`) e usar **`.extend()`** / **`.merge()`**.
- **SEARCH** e **INCLUDES**: aplicar **`.partial()`** no final para campos opcionais sem duplicar dezenas de campos.

## Integração com Hono

- Schemas de request entram no **`validator('query' | 'json' | 'param', Schema)`** nos controllers.
- Schemas de response alimentam **`describeRoute`** / `mapResponses`.

## Exemplo obrigatório — entidade Guest

```ts
const GuestBaseModelSchema = z.object({
  id: z.number().int(),
  fullName: z.string(),
  email: z.string().email(),
  orgId: z.number().int(),
})

export const GuestModelSchema = GuestBaseModelSchema.extend({
  plusOneName: z.string().nullable(),
})

export const GuestRequestSchema = {
  CREATE: z.object({
    fullName: z.string().min(1).max(200),
    email: z.string().email(),
    plusOneName: z.string().min(1).max(200).optional(),
  }),
  GET: z.object({
    guestId: z.number().int(),
  }),
  UPDATE: z.object({
    fullName: z.string().min(1).max(200),
    email: z.string().email(),
    plusOneName: z.string().min(1).max(200).optional(),
  }),
  DELETE: z.object({
    guestId: z.number().int(),
  }),
  SEARCH: z
    .object({
      email: z.string().email(),
    })
    .partial(),
  INCLUDES: z
    .object({
      rsvp: z.boolean(),
    })
    .partial(),
}

export const GuestResponseSchema = {
  COLLECTION: z.object({
    data: z.array(GuestModelSchema),
  }),
  SINGLE: z.object({
    data: GuestModelSchema.nullable(),
  }),
}
```

## Anti-patterns

- Colocar **validação de formato** (min/max, uuid, email) em **controller** ou **service**.
- **Schemas soltos** sem agrupamento por entidade.
- Duplicar o mesmo shape em três arquivos em vez de base + `partial()`/`.extend()`.
