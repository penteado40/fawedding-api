# fawedding-api — Referência de Endpoints

Referência completa de todas as rotas da API, pra consumo por humanos ou por outra IA/agente. Documentação interativa gerada automaticamente também disponível em `/api/docs` (Scalar) e `/api/openapi` (JSON) quando o servidor está rodando.

## Convenções gerais

- **Base URL:** `{API_URL}/api` (local: `http://localhost:3000/api`)
- **Sucesso:** `{ "data": ... }`
- **Erro:** `{ "errors": "mensagem" }`
- **Autenticação:** `Authorization: Bearer <token>` em toda rota, exceto as públicas listadas abaixo.
- **JSON keys:** camelCase. **URLs:** inglês, substantivos no plural.

### Rotas públicas (sem autenticação)

- `GET /openapi`
- `GET /docs`
- `POST /auth/login`
- `POST /auth/token`

### Autenticação — dois tipos de ator

O valor do Bearer token determina o tipo de ator, sem rota separada:

1. **JWT** (contém `.`, obtido via `POST /auth/login`) → ator `user`. Tem `role` (`SUPER_ADMIN` ou `USER`) e a lista de `weddingId`s que gerencia (via `WeddingManager`). `SUPER_ADMIN` ignora o vínculo de gerência e acessa qualquer wedding.
2. **API Token** (string opaca, criada via `POST /api-tokens`) → ator `apiToken`, vinculado a **um único** `weddingId`. Uso pensado para o frontend público de cada casamento.

**Importante:** um ator `apiToken` só pode fazer **uma única coisa**: `POST /weddings/:weddingId/rsvps` no wedding ao qual foi emitido. Qualquer outra rota (incluindo `GET` na mesma rota de RSVPs) retorna `403` pra esse tipo de ator — é enforçado no middleware de auth, não rota a rota.

Toda rota aninhada sob `/weddings/:weddingId/...` valida acesso via `WeddingAccessService.assertCanAccessWedding(actor, weddingId)`: `SUPER_ADMIN` ou gerente daquele wedding → passa; `apiToken` só passa se `weddingId` bater com o token; qualquer outro caso → `403 Forbidden`.

### Erros comuns

| Status | Quando |
|---|---|
| `400` | Validação de body/query/params falhou (Zod) — `errors` traz a mensagem específica |
| `401` | Sem Bearer token, token inválido/expirado, ou token não encontrado |
| `403` | Autenticado mas sem permissão pro recurso (`WeddingAccessService`, ou `apiToken` fora da sua única rota permitida) |
| `404` | Recurso não encontrado |
| `409` | Conflito de unicidade (email duplicado no wedding, slug duplicado, etc.) |
| `500` | `DATABASE_URL`/`JWT_SECRET` não configurados, ou erro interno |

---

## Modelos (shape das entidades)

### User
```
{ id: number, name: string, email: string, role: 'SUPER_ADMIN' | 'USER' }
```

### Wedding
```
{
  id: number, name: string, slug: string, siteUrl: string,
  date: string (ISO), createdAt: string, updatedAt: string,
  managers: [{ id, userId, name, email, createdAt }]
}
```
`siteUrl` alimenta o link do CTA no email de confirmação e o domínio do remetente (`noreply@<hostname de siteUrl>`).

### Rsvp
```
{
  id: number, weddingId: number, name: string, email: string, phone: string,
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED',
  emailStatus: 'PENDING' | 'SENT' | 'FAILED',
  emailSentAt: string (ISO) | null,
  emailError: string | null,
  createdAt: string, updatedAt: string
}
```
`status` é sempre `CONFIRMED` na criação — não existe fluxo de double opt-in. `emailStatus`/`emailSentAt`/`emailError` rastreiam o envio do email de confirmação (ver seção RSVPs abaixo).

### ApiToken
- Listagem/get/update/delete retornam **sem** o valor do token: `{ id, weddingId, name, isActive, createdAt, updatedAt }`
- Só a criação (`POST /api-tokens`) retorna o campo `token` (valor cru) — é a única vez que ele aparece.

### Gift
```
{ id: number, name: string, image: string | null, amazonLink: string | null, price: number, createdAt: string, updatedAt: string }
```
`image` é o nome do arquivo salvo em `uploads/` — a URL completa é `{API_URL}/gifts/uploads/{image}`.

---

## Auth — `/api/auth`

### `POST /auth/login`
Login de admin/gerente. **Público.**
- Body: `{ email: string, password: string }`
- `200`: `{ data: { token: string (JWT, expira em 1h), user: User } }`

### `POST /auth/token`
Adapter OAuth2 password grant, **usado só pela UI do Scalar** (`/api/docs`) pra autenticar interativamente — não é pra clientes da API usarem direto, use `/auth/login`. **Público.**
- Body (`form`): `{ grant_type: 'password', username: string (email), password: string }`
- `200`: `{ access_token: string, token_type: 'bearer', expires_in: 3600 }` (sem envelope `{ data }` — segue o formato padrão OAuth2)

---

## Weddings — `/api/weddings`

Entidade de tenant. Todo RSVP e ApiToken pertence a exatamente um wedding.

### `GET /weddings`
Lista weddings visíveis ao ator: todos para `SUPER_ADMIN`, só os gerenciados para `USER`. **Auth: JWT.**
- `200`: `{ data: Wedding[] }`

### `POST /weddings`
Cria um wedding novo. **Auth: JWT, `SUPER_ADMIN` apenas.**
- Body: `{ name: string, slug: string (lowercase, alfanumérico + hífen), siteUrl: string (URL válida), date: string (dd/mm/yyyy) }`
- `201`: `{ data: Wedding }`
- `409` se `slug` já existir

### `GET /weddings/:id`
Busca um wedding por id. **Auth: JWT, gerente daquele wedding ou `SUPER_ADMIN`.**
- `200`: `{ data: Wedding }` · `404` se não existir

### `POST /weddings/:id/managers`
Vincula um `User` existente como gerente do wedding. **Auth: JWT, `SUPER_ADMIN` apenas.**
- Body: `{ userId: number }`
- `201`: `{ data: { id, weddingId, userId, createdAt } }`

### `DELETE /weddings/:id/managers/:userId`
Remove o vínculo de gerência. **Auth: JWT, `SUPER_ADMIN` apenas.**
- `200`: `{ data: { id, weddingId, userId, createdAt } }` (registro removido)

---

## RSVPs — `/api/weddings/:weddingId/rsvps`

Confirmações de presença, aninhadas por wedding. Na criação, o RSVP é salvo com `status: CONFIRMED` e, na mesma requisição, um email de confirmação é disparado via Resend de forma **fire-and-forget** — o `POST` nunca espera o envio nem falha por causa dele. O resultado do envio fica registrado no próprio RSVP (`emailStatus`/`emailSentAt`/`emailError`); não há fila nem retry automático — reprocessamento é sempre manual via `resend-email`.

### `GET /weddings/:weddingId/rsvps`
Lista RSVPs do wedding, com filtro opcional por `status`. **Auth: JWT (gerente/`SUPER_ADMIN`).** (`apiToken` **não** tem acesso a este `GET` — só ao `POST` abaixo.)
- Query: `{ status?: 'PENDING' | 'CONFIRMED' | 'DECLINED' }`
- `200`: `{ data: Rsvp[] }`

### `POST /weddings/:weddingId/rsvps`
Cria um RSVP e dispara o email de confirmação. **Auth: JWT (gerente/`SUPER_ADMIN`) OU ApiToken escopado a este `weddingId`** — única rota que um ApiToken pode chamar.
- Body: `{ name: string (1-200), email: string, phone: string (1-20) }`
- `201`: `{ data: Rsvp }` (com `emailStatus: 'PENDING'` no momento da resposta — o envio ainda está em andamento)
- `409` se `email` já registrado **neste** wedding (o mesmo email pode confirmar em weddings diferentes)

### `POST /weddings/:weddingId/rsvps/:id/resend-email`
Reenvia manualmente o email de confirmação pra um RSVP existente, independente do `emailStatus` atual. Não existe retry automático — esta é a única forma de reprocessar um envio que falhou. **Auth: JWT (gerente/`SUPER_ADMIN`).**
- `200`: `{ data: Rsvp }` (com `emailStatus`/`emailSentAt`/`emailError` atualizados pelo resultado desta tentativa)
- `404` se o RSVP não existir neste wedding

### `GET /weddings/:weddingId/rsvps/email-preview`
Renderiza em HTML o template de email daquele wedding, com dados mockados — não envia email nem exige RSVP real. Útil pra ver o template no navegador durante desenvolvimento. **Auth: JWT (gerente/`SUPER_ADMIN`).**
- `200`: HTML puro (não é `{ data }`, é a página renderizada direto)

---

## API Tokens — `/api/api-tokens`

Tokens estáticos usados por integrações externas (o frontend público de cada wedding) pra criar RSVPs sem login de usuário. O valor bruto só aparece na criação.

### `GET /api-tokens`
Lista todos os tokens (metadados — sem o valor). **Auth: JWT** (qualquer usuário autenticado, sem filtro por wedding gerenciado).
- Query opcional: filtro por `id`, `weddingId`, `name`, `isActive`
- `200`: `{ data: ApiTokenMeta[] }`

### `POST /api-tokens`
Cria um novo token, escopado a um wedding. **Auth: JWT, precisa `assertCanAccessWedding` no `weddingId` informado** (gerente daquele wedding ou `SUPER_ADMIN`).
- Body: `{ name: string (1-200, único), weddingId: number }`
- `201`: `{ data: { id, weddingId, name, isActive, createdAt, updatedAt, token: string } }` — **única resposta que inclui `token`**

### `GET /api-tokens/:id`
Busca metadados de um token por id. **Auth: JWT** (sem checagem de wedding — qualquer usuário autenticado pode consultar qualquer token).
- `200`: `{ data: ApiTokenMeta }`

### `PUT /api-tokens/:id`
Atualiza `name` e/ou `isActive`. **Auth: JWT** (sem checagem de wedding).
- Body: `{ name?: string, isActive?: boolean }`
- `200`: `{ data: ApiTokenMeta }`

### `DELETE /api-tokens/:id`
Remove o token permanentemente — requisições em andamento com esse token passam a ser rejeitadas imediatamente. **Auth: JWT** (sem checagem de wedding).
- `200`: `{ data: ApiTokenMeta }` (registro removido)

> **Nota:** diferente das rotas de `Weddings`/`RSVPs`, as rotas de leitura/edição/remoção de `api-tokens` (`GET /:id`, `PUT /:id`, `DELETE /:id`, e o `GET /` de listagem) não checam se o usuário gerencia o wedding daquele token — qualquer `user` autenticado, de qualquer wedding, pode ver/editar/apagar tokens de qualquer outro wedding. Só a criação (`POST /`) checa acesso ao `weddingId`. Vale considerar apertar isso se o número de weddings/gerentes crescer.

---

## Gifts — `/api/gifts`

Lista de presentes. Não é escopada por wedding (lista global, única) e não tem checagem de gerência — qualquer ator `user` autenticado (`SUPER_ADMIN` ou `USER`, de qualquer wedding) pode ler e escrever.

### `GET /gifts`
Lista presentes, com filtro opcional por `name` (parcial, case-insensitive). **Auth: JWT.**
- Query: `{ name?: string }`
- `200`: `{ data: Gift[] }`

### `POST /gifts`
Cria um presente. **Auth: JWT.** Body `multipart/form-data`.
- Form: `{ name: string (1-200), price: number > 0, amazonLink?: string (URL) | '', image?: file }`
- `201`: `{ data: Gift }`

### `GET /gifts/:id`
Busca um presente por id (UUID). **Auth: JWT.**
- `200`: `{ data: Gift }` · `404` se não existir

### `PUT /gifts/:id`
Atualiza um presente (campos omitidos ficam como estavam; omitir `image` mantém o arquivo atual). **Auth: JWT.** Body `multipart/form-data`.
- Form: `{ name?, price?, amazonLink?, image?: file }`
- `200`: `{ data: Gift }`

### `DELETE /gifts/:id`
Remove um presente. **Auth: JWT.**
- `200`: `{ data: Gift }` (registro removido)

### `GET /gifts/uploads/:filename`
Serve o arquivo de imagem salvo em `uploads/`. **Auth: JWT.**
- `200`: binário da imagem (`Content-Type` pelo mime do arquivo)
- `404`: `{ message: 'Image not found' }` se o arquivo não existir

---

## O que NÃO existe (apesar de já ter sido documentado em algum momento)

- **`/api/messages`** — não existe controller, model, nem rota. Se aparecer referenciado em algum lugar, está desatualizado.
