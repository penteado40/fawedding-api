# Controllers — FAWedding API

**Path:** `src/controllers/**/*.ts`

Regras para rotas HTTP no Hono: OpenAPI, validação Zod, factory de service e resposta `{ data }`.

## Estrutura de rota

Toda rota exposta no controller deve seguir esta ordem:

1. **`controller.get` / `post` / `put` / `patch` / `delete`** — método HTTP no router do controller.
2. **`describeRoute({ ... })`** — obrigatório: `summary`, `tags`, `description`, `responses` (usar `mapResponses` com schema de resposta e mensagem de sucesso).
3. **`validator(...)`** — obrigatório para query, json ou param conforme a rota.
4. **Handler `async (c) => { ... }`** — sempre assíncrono e recebendo o Context do Hono.

Sem `describeRoute` ou sem `validator` onde houver entrada HTTP, a rota não está no padrão do projeto.

## Uso do Context

- Receber sempre **`(c)`** no handler.
- Dados validados vêm de **`c.req.valid('query' | 'json' | 'param' | 'form' | 'cookie' | 'header')`**, alinhado ao primeiro argumento do `validator`.
- **Nunca** usar `c.req.json()` (ou parse manual de body/query) sem passar pelo `validator` correspondente.

## Integração com service

- **Sempre** obter o service via factory: **`createXService(c)`** (ex.: `createVenueService(c)`).
- **Nunca** instanciar service com `new` ou import estático que ignore o contexto da requisição.
- **Nunca** importar ou usar **Prisma** (ou queries diretas) no controller.

## Resposta

- Resposta de sucesso padronizada: **`{ data: ... }`**.
- Enviar com **`c.json({ data: response })`** (ajustar status com `c.json(..., 201)` quando fizer sentido).

## Exemplo obrigatório (GET + query + `list`)

```ts
venueController.get(
  '/',
  describeRoute({
    summary: 'List all venues',
    tags: ['Venues'],
    description: 'List all venues',
    responses: mapResponses({
      schema: VenueResponseSchema.COLLECTION,
      successMessage: 'Venues found successfully',
    }),
  }),
  validator('query', VenueRequestSchema.SEARCH),
  async (c) => {
    const search = c.req.valid('query')
    const service = createVenueService(c)
    const response = await service.list(search, { parent: true })
    return c.json({ data: response })
  },
)
```

## Anti-patterns

- Acessar **banco** (Prisma, SQL) no controller.
- **Pular** `validator` e ainda assim ler body/query/param.
- Colocar **regra de negócio** no handler (deve ficar no service).
- Retornar payload solto sem wrapper **`{ data }`**.
- **`try/catch`** no controller para montar corpo de erro — deixar subir para `onError`.
