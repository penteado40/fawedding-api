# fawedding-api

> REST API powering the [F&A Wedding](https://fawedding.com.br) ecosystem — guests, RSVPs, gift list, and messages, with a serverless email confirmation pipeline built on AWS SQS, Lambda, and SES.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002?style=flat&logo=hono&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![AWS Lambda](https://img.shields.io/badge/AWS_Lambda-FF9900?style=flat&logo=awslambda&logoColor=white)
![AWS CDK](https://img.shields.io/badge/AWS_CDK-232F3E?style=flat&logo=amazonaws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

---

## Overview

fawedding-api is the backend for a real, production wedding website. It handles guest data, RSVP submissions, gift list, and messages to the couple — and, most importantly, drives an asynchronous email confirmation pipeline via AWS SQS, Lambda, and SES.

When a guest submits their RSVP, the API persists the record and enqueues a message to SQS. A Lambda function picks it up asynchronously and sends a personalized confirmation email through SES. The entire AWS infrastructure is defined and deployed with **AWS CDK in TypeScript** — same language as the rest of the stack.

This is part of the **FAWedding ecosystem**:

| Repo | Description | Deploy |
|------|-------------|--------|
| [fa-wedding](https://github.com/penteado40/fa-wedding) | React frontend | GitHub Pages |
| **fawedding-api** | This repo — Hono REST API | Serverless |

---

## Architecture

### System overview

```
┌──────────────────────────────────────────────────────────┐
│  fa-wedding — GitHub Pages                               │
│  React + TypeScript                                      │
│                                                          │
│  ConfirmationForm  ──POST /rsvps──►  fawedding-api       │
└──────────────────────────────────────────────────────────┘
                                            │
                              validate (Zod) + persist (Prisma)
                                            │
                                   enqueue to SQS
                                            │
                                            ▼
┌──────────────────────────────────────────────────────────┐
│  AWS (CDK-managed)                                       │
│                                                          │
│  SQS Queue  ──triggers──►  Lambda                        │
│                                │                         │
│                                ▼                         │
│                               SES  ──►  guest email      │
└──────────────────────────────────────────────────────────┘
```

### Request lifecycle

```
HTTP Request
  └─ cors middleware          Sets CORS headers
  └─ [public routes]          GET /openapi, GET /docs
  └─ auth middleware           Validates Bearer token against api_tokens table
  └─ validator                 Validates body/params with Zod + OpenAPI schema
  └─ controller                Calls service, returns { data }
  └─ service                   Business logic + Prisma + SQS enqueue
  └─ model mapper              Shapes response, strips sensitive fields
  └─ onError (global)          Handles HTTPException | ZodError | Error
```

### Project structure

```
src/
├── index.ts              # Bootstrap: middlewares, docs, onError, route mounting
├── server.ts             # Server initialization
├── controllers/          # HTTP handlers — Hono routes with describeRoute + validator
├── services/             # Business logic — Prisma access + SQS integration
├── schemas/              # Zod schemas with OpenAPI annotations
├── models/               # TypeScript types + response mappers (toXResponse)
├── routes/               # Per-module route files + barrel index.ts
├── core/                 # Base classes (AbstractService)
├── lib/                  # Prisma client, OpenAPI config, Scalar docs setup
├── types/                # Global Hono types (AppEnv, ApplicationVariables)
└── utils/                # Shared utilities
```

---

## Key Technical Decisions

### SQS between API and email delivery
The API returns `201` to the guest as soon as the RSVP is saved — it never waits for the email. SQS acts as a durable buffer: if Lambda fails or SES is throttled, the message stays in the queue and retries automatically. This keeps the guest-facing response fast and reliable regardless of downstream email delivery.

### Lambda for email processing
Email composition and delivery are isolated to a Lambda function — completely separate from the API. This means the email logic can change, be redeployed, or be replaced without touching the API. It also scales independently and costs nothing when idle.

### CDK for infrastructure
All AWS resources (SQS queue, Lambda function, SES configuration, IAM roles and policies) are defined in TypeScript with AWS CDK. Infrastructure is version-controlled alongside the application code, reproducible from scratch in any AWS account, and can be torn down completely with a single command.

### Static bearer token auth
The site serves a known, invite-only guest list — there are no public user accounts. A static bearer token validated against the `api_tokens` table in the database provides sufficient security without the overhead of session management or OAuth. Token creation is one-way: the raw value is shown once on `POST /api-tokens` and never again.

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
# Create a token (first token is created via seed:token — see setup below)
curl -X POST http://localhost:3000/api/api-tokens \
  -H "Authorization: Bearer <existing-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "frontend"}'
```

### Guests — `/api/guests`

Guest registry. Stores names, contact info, and invitation metadata.

### RSVPs — `/api/rsvps`

Confirmation submissions. On `POST`, saves the RSVP and enqueues the SQS message that triggers the confirmation email via Lambda + SES.

### Gifts — `/api/gifts`

Gift list items. Each item links to the external registry (Lejour).

### Messages — `/api/messages`

Messages submitted by guests to the couple.

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

---

## Related

- **[fa-wedding](https://github.com/penteado40/fa-wedding)** — React frontend for the wedding site (GitHub Pages)
- **[inventory-api](https://github.com/penteado40/inventory-api)** — Multi-tenant inventory REST API (Hono · TypeScript · Prisma · PostgreSQL)

---

## Author

**Felipe Penteado** — Full Stack Engineer
[felipepenteado.com.br](https://felipepenteado.com.br) · [LinkedIn](https://linkedin.com/in/felipepenteado) · [GitHub](https://github.com/penteado40)
