# Routes & Route Modules — FAWedding API

## `src/index.ts` — ponto de montagem da API

Tipos do Hono, middlewares globais, documentação, erro e **`app.route()`** dos controllers. Os handlers continuam nos **controllers**; este arquivo só organiza a app e registra routers.

### App Hono

- Instanciar com **Bindings** e **Variables** tipados (ex.: `DATABASE_URL` em `Bindings`; `ApplicationVariables` em `Variables` — prisma no contexto, etc.).
- Usar **`.basePath('/api')`** (ou o prefixo único do projeto) para todas as rotas abaixo.

### Middlewares (ordem)

1. **Prisma (ou datastore):** middleware que obtém cliente com `getPrisma(c.env.DATABASE_URL)` e **`c.set('prisma', prisma)`** antes de `next()`.
2. **Autenticação global:** ex. **`clerkMiddleware()`** em `'*'` quando o projeto usar Clerk.
3. **CORS:** `app.use('*', async (c, next) => cors({ ... })(c, next))` com origem, headers e métodos alinhados ao front.

Ordem importa: o que precisa de `env`/contexto deve rodar antes dos controllers.

### Documentação e erros

- **`startDocs(app)`** — registrar OpenAPI/Scalar após middlewares essenciais e antes ou junto do registro de rotas.
- **`app.onError`** — tratar pelo menos:
  - **`HTTPException`** → status do erro, corpo `{ errors: err.message }`;
  - **`z.ZodError`** → **400**, mensagem de validação;
  - **demais** → **500**, mensagem genérica.

### Registro de controllers

- **Um controller por entidade/recurso**, definido em **`src/controllers/*.controller.ts`**.
- Montar na app raiz com **`app.route('/', nomeController)`** — o prefixo de recurso (ex.: `/gifts`, `/guests`) fica **dentro** do controller.
- **Não** repetir `app.route('/', mesmoController)` duas vezes para o mesmo módulo.

### Exemplo de wiring

```ts
const app = new Hono<{
  Bindings: { DATABASE_URL: string }
  Variables: ApplicationVariables
}>().basePath('/api')

app.use(async (c, next) => {
  const prisma = getPrisma(c.env.DATABASE_URL)
  c.set('prisma', prisma)
  await next()
})

app.use('*', clerkMiddleware())

app.use('*', async (c, next) => {
  return cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })(c, next)
})

startDocs(app)

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

app.route('/', healthController)
app.route('/', venueController)
app.route('/', guestController)
```

---

## `src/routes/` — route modules

- Cada recurso pode ter um `*.routes.ts` que **reexporta** o `Hono` definido em `src/controllers/*.controller.ts`, para o `app.route()` em `src/index.ts` importar de um único lugar.
- **`src/routes/index.ts`** agrega os exports (`giftController`, futuros controllers) para `import { … } from './routes'` no `index` da app.

Não colocar handlers HTTP aqui — só reexport ou barrel.

---

## Anti-patterns

- **Duplicar** `app.route('/', controller)` para o mesmo controller.
- Rota em controller **sem** documentação OpenAPI ou **sem** `validator` quando houver entrada HTTP.
- Lógica de negócio ou queries no `index.ts` — só wiring, middleware e tratamento global de erro.
- Handlers HTTP dentro de `src/routes/` — apenas reexports.
