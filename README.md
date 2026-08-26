# fawedding-api

> REST API powering the [F&A Wedding](https://fawedding.com.br) ecosystem — guests, RSVPs, and gift list, with a direct email confirmation flow built on Resend and React Email.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002?style=flat&logo=hono&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Resend](https://img.shields.io/badge/Resend-000000?style=flat&logo=resend&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

---

## Overview

fawedding-api is the backend for a real, production wedding website. It handles guest data, RSVP submissions, and the gift list — and, most importantly, sends a personalized confirmation email the moment a guest RSVPs.

When a guest submits their RSVP, the API persists the record and immediately sends a confirmation email via **Resend**, rendering the wedding-specific **React Email** template in the same request (fire-and-forget — a failed send never blocks or fails the guest's response). The platform is multi-tenant: each `Wedding` can have its own frontend, domain, and email template. Delivery outcome is tracked on the RSVP itself (`emailStatus`, `emailSentAt`, `emailError`), and a manager can trigger a manual resend if a send failed — there's no queue and no automatic retry, by design, given the project's volume (dozens to a few hundred RSVPs per wedding).

This is part of the **FAWedding ecosystem**. Being multi-tenant, this API can serve more than one wedding, each with its own frontend:

| Repo | Description | Deploy |
|------|-------------|--------|
| [fawedding](https://github.com/penteado40/fawedding) | React frontend for Felipe & Amanda (wedding id `1`) | Vite |
| **fawedding-api** | This repo — Hono REST API | Serverless |

---

## Architecture

### System overview

```
┌──────────────────────────────────────────────────────────┐
│  fawedding (or another wedding's frontend)                │
│  React + TypeScript                                      │
│                                                          │
│  ConfirmationForm  ──POST /weddings/:id/rsvps──►  fawedding-api │
└──────────────────────────────────────────────────────────┘
                                            │
                              validate (Zod) + persist (Prisma)
                                            │
                          fire-and-forget: render template + send
                                            │
                                            ▼
                            Resend  ──►  guest email
```

### Request lifecycle

```
HTTP Request
  └─ cors middleware          Sets CORS headers
  └─ [public routes]          GET /openapi, GET /docs
  └─ auth middleware           Validates Bearer token against api_tokens table
  └─ validator                 Validates body/params with Zod + OpenAPI schema
  └─ controller                Calls service, returns { data }
  └─ service                   Business logic + Prisma + confirmation email send
  └─ model mapper              Shapes response, strips sensitive fields
  └─ onError (global)          Handles HTTPException | ZodError | Error
```

### Project structure

```
src/
├── index.ts              # Bootstrap: middlewares, docs, onError, route mounting
├── server.ts             # Server initialization
├── controllers/          # HTTP handlers — Hono routes with describeRoute + validator
├── services/             # Business logic — Prisma access + confirmation email send
├── schemas/              # Zod schemas with OpenAPI annotations
├── models/               # TypeScript types + response mappers (toXResponse)
├── middlewares/          # Hono middlewares (auth)
├── core/                 # Base classes (AbstractService)
├── emails/               # Confirmation email templates — see below
├── lib/                  # Prisma client, OpenAPI config, Scalar docs setup, Resend client
└── types/                # Global Hono types (AppEnv, ApplicationVariables, Actor)
```

### Email templates (`src/emails/`)

```
emails/
├── types.ts                       # ConfirmationEmailProps contract every template implements
├── registry.ts                    # weddingId → template component, falls back to generic
└── templates/
    ├── generic.tsx                 # ConfirmationEmailLayout (shared shell) + the fallback itself
    ├── felipe-amanda.tsx            # ~25 lines: palette + copy + hero photo, wraps the layout
    └── <next-wedding>.tsx           # same pattern for each new wedding
```

`ConfirmationEmailLayout` (in `generic.tsx`) is the one place that owns the actual markup — fonts, hero section, info cards, CTA, footer. Every wedding-specific template is just that layout configured with a color palette, hero image URL, and copy; adding a wedding never means duplicating HTML. The layout also degrades gracefully with no photo/venue data, which is what makes it usable as the fallback for weddings without a dedicated template.

---

## Key Technical Decisions

### Direct email send, no queue
The API returns `201` to the guest as soon as the RSVP is saved — it never waits for the email (send is fire-and-forget). An earlier version of this project ran the send through SQS + Lambda + SES for the sake of demonstrating an async AWS pipeline; that infrastructure was built, evaluated, and then torn down as unnecessary complexity for the actual volume (dozens to a few hundred RSVPs per wedding). There's no automatic retry: a failed send is recorded on the RSVP (`emailStatus = FAILED`, `emailError`) and reprocessed only via an explicit manual resend (`POST /weddings/:weddingId/rsvps/:id/resend-email`) — always a deliberate action by whoever manages the wedding, never silent.

### Template per wedding
The platform is multi-tenant, and each wedding can have its own frontend and visual identity. The confirmation email template mirrors that: a small in-code registry maps `weddingId` → React Email component, with a generic fallback for weddings without a dedicated one. Resend accepts a React component directly (`resend.emails.send({ react: <Component /> })`), so there's no manual HTML-rendering step in the send path. The sender address is derived from `Wedding.siteUrl`'s hostname (`noreply@<hostname>`) — each domain needs to be verified in Resend before it can send for real, a manual step done once per wedding.

### Static bearer token auth
The site serves a known, invite-only guest list — there are no public user accounts. A static bearer token validated against the `api_tokens` table in the database provides sufficient security without the overhead of session management or OAuth. Token creation is one-way: the raw value is shown once on `POST /api-tokens` and never again. Each token is scoped to a single wedding and can only be used to create RSVPs for that wedding.

### Multi-tenant weddings
Every RSVP and API token belongs to a `Wedding`. A `User` manages zero or more weddings (via `WeddingManager`); a `SUPER_ADMIN` bypasses that check and has unrestricted access to every wedding. Access is enforced by `WeddingAccessService` and denied requests always return `403 Forbidden`. See [API Reference](#weddings--apiweddings) below.

### Hono + Zod + OpenAPI in one pass
The `zod-openapi` + `hono-openapi` combination lets the same Zod schema validate the request *and* generate the OpenAPI spec simultaneously. No drift between documentation and actual validation — they're the same artifact.

---

## API Reference

Full interactive documentation is available at `/api/docs` (Scalar). Below is a summary of all modules.

### API Tokens — `/api/api-tokens`

Token management for API authentication. The raw token value is returned **only at creation** — store it immediately.

| Method | Route | Description | Returns token? |
|--------|-------|-------------|----------------|
| `GET` | `/api-tokens` | List all tokens | No |
| `POST` | `/api-tokens` | Create new token | ✅ Once only |
| `GET` | `/api-tokens/:id` | Get token by ID | No |
| `PUT` | `/api-tokens/:id` | Update token | No |
| `DELETE` | `/api-tokens/:id` | Remove token | No |

```bash
# Create a token scoped to wedding 1 (first token is created via seed:token — see setup below)
curl -X POST http://localhost:3000/api/api-tokens \
  -H "Authorization: Bearer <existing-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name": "frontend", "weddingId": 1}'
```

### Weddings — `/api/weddings`

Tenant entity. Every RSVP and API token belongs to exactly one wedding. `siteUrl` doubles as the confirmation email's CTA link and the source for the sender domain (`noreply@<hostname of siteUrl>`) — see [Template per wedding](#template-per-wedding) above.

| Method | Route | Description | Access |
|--------|-------|-------------|--------|
| `GET` | `/weddings` | List weddings (all for `SUPER_ADMIN`, managed-only for `USER`) | JWT |
| `POST` | `/weddings` | Create a wedding | `SUPER_ADMIN` |
| `GET` | `/weddings/:id` | Get wedding by id | manager or `SUPER_ADMIN` |
| `POST` | `/weddings/:id/managers` | Link an existing user as a manager (`{ userId }`) | `SUPER_ADMIN` |
| `DELETE` | `/weddings/:id/managers/:userId` | Unlink a manager | `SUPER_ADMIN` |

### RSVPs — `/api/weddings/:weddingId/rsvps`

Confirmation submissions, nested under their wedding. On `POST`, saves the RSVP and sends the confirmation email via Resend in the same request, fire-and-forget. Email uniqueness is scoped per wedding — the same guest email can RSVP to different weddings. Reachable by a JWT-authenticated manager/`SUPER_ADMIN` (`GET`/`POST`), or by an `ApiToken` scoped to that wedding (`POST` only).

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/weddings/:weddingId/rsvps` | List RSVPs for the wedding |
| `POST` | `/weddings/:weddingId/rsvps` | Create an RSVP, triggers confirmation email |
| `POST` | `/weddings/:weddingId/rsvps/:id/resend-email` | Manually resend the confirmation email |
| `GET` | `/weddings/:weddingId/rsvps/email-preview` | Render the wedding's email template with mocked data, in-browser |

### Gifts — `/api/gifts`

Gift list items. Each item links to the external registry (Lejour).

> Full request/response schemas, query parameters, and example payloads are in the interactive docs at `/api/docs`.

---

## Authentication

Every protected route requires:

```http
Authorization: Bearer <token>
```

The token is validated on each request against the `api_tokens` table. Public routes (no auth required):

- `GET /api/openapi`
- `GET /api/docs`

---

## Response conventions

- **Success:** `{ "data": ... }`
- **Error:** `{ "errors": "..." }`
- URLs in English, plural nouns: `/guests`, `/rsvps`, `/gifts`
- JSON keys in camelCase
- Business logic and Prisma access: services only
- Controllers stay thin — validate, call service, return

---

## Local Setup

**Prerequisites:** Node.js 18+, Docker

```bash
# 1. Clone
git clone https://github.com/penteado40/fawedding-api.git
cd fawedding-api

# 2. Environment
cp .env.example .env
# Set DATABASE_URL (see table below)

# 3. Start database
docker compose up -d

# 4. Install dependencies
npm install

# 5. Run migrations
npx prisma migrate dev

# 6. Create the first API token
npm run seed:token
# The token is shown once in the console — copy it now

# 7. Start dev server
npm run dev
```

API: `http://localhost:3000/api`
Docs: `http://localhost:3000/api/docs`

### Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/fawedding`) |
| `JWT_SECRET` | Secret used to sign/verify manager login JWTs |
| `RESEND_API_KEY` | API key used to send confirmation emails via Resend. Without it, sends fail gracefully (`emailStatus = FAILED`) — the RSVP itself still succeeds |

---

## Related

- **[fawedding](https://github.com/penteado40/fawedding)** — React frontend for Felipe & Amanda's wedding site
- **[inventory-api](https://github.com/penteado40/inventory-api)** — Multi-tenant inventory REST API (Hono · TypeScript · Prisma · PostgreSQL)

---

## Author

**Felipe Penteado** — Full Stack Engineer
[felipepenteado.com.br](https://felipepenteado.com.br) · [LinkedIn](https://linkedin.com/in/felipepenteado) · [GitHub](https://github.com/penteado40)
