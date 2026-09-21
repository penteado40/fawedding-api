# Issue #9 — Security hardening: summary & rollout checklist

Status: **code complete, not yet deployed**. This doc summarizes what changed on
`feat/issue-13` for [issue #9](https://github.com/penteado40/fawedding-api/issues/9)
and exactly what you still need to do before it's safe to merge and deploy.

## What this issue was about

A security audit found: no rate limiting, no security headers, a CORS config that
reflects any origin, an error handler that could leak raw exception messages, `ApiToken`
values stored in plaintext, and no CI (no typecheck, no secret scanning). None of it was
exploited, but the API now serves real unauthenticated guests (RSVP + PIX gift payments)
across more than one tenant, so the exposure was real.

## What changed

| Area | Change | Files |
|---|---|---|
| Security headers | Hono's `secureHeaders()` applied globally | `src/index.ts` |
| CORS | `origin: '*'` + `credentials: true` replaced with an explicit allowlist read from `CORS_ORIGINS` (comma-separated env var), credentials dropped (auth is Bearer-token, not cookie-based) | `src/lib/cors-config.ts`, `src/index.ts` |
| Rate limiting | In-memory fixed-window limiter, single-instance by design, unit tested | `src/lib/rate-limiter.ts`, `src/middlewares/rate-limit.middleware.ts`, `src/lib/rate-limit-config.ts` |
| Rate limiting — applied to | `POST /auth/login` (keyed by IP + attempted email), `POST /weddings/:id/rsvps`, `POST /weddings/:id/gift-payments`, `PATCH /weddings/:id/gift-payments/:id/confirm` | `src/controllers/auth.controller.ts`, `rsvp.controller.ts`, `gift-payment.controller.ts` |
| Error handler | Fallback branch now gated by `NODE_ENV` — real `err.message` in dev, generic message in production. Server-side `console.error` unchanged. | `src/index.ts` |
| `ApiToken` hashing | New `tokenHash` column (SHA-256); auth middleware looks up by hash instead of plaintext `token`; token creation writes both columns; plaintext `token` kept for one release (rollback safety) | `prisma/schema.prisma`, `src/lib/token-hash.ts`, `src/middlewares/auth.middleware.ts`, `src/services/api-token.service.ts` |
| Bonus fix | `GET /api-tokens` was leaking plaintext tokens in listings despite its own docstring claiming it didn't — fixed to return metadata only | `src/services/api-token.service.ts`, `src/schemas/api-token.schema.ts` |
| CI | New GitHub Actions workflow: typecheck, test, gitleaks secret scan on every push/PR | `.github/workflows/ci.yml` |
| Dependency updates | Dependabot, npm ecosystem, weekly | `.github/dependabot.yml` |
| Tests | First test coverage in the repo (Vitest) — rate limiter and token hashing, per the PRD's testing decisions | `src/lib/rate-limiter.test.ts`, `src/lib/token-hash.test.ts` |
| Misc | `/dist` was never gitignored — fixed. `npm run build` now uses `tsconfig.build.json` so `.test.ts` files aren't compiled into the shipped `dist/`. | `.gitignore`, `tsconfig.build.json`, `package.json` |

Verified locally: `npx tsc --noEmit`, `npm test` (7/7 passing), `npm run build`, and manual
smoke tests against a running dev server (security headers present, CORS allowlist
correctly allows/denies, login rate limit trips at request 11 within the window).

## What you need to do

These are **not done yet** — they touch the live Neon database or deploy config, so they
were deliberately left for you rather than run automatically.

### 1. Apply the database migration

```bash
npm run prisma:migrate
```

This adds the nullable `tokenHash` column to `api_tokens`
(`prisma/migrations/20260917000000_add_api_token_hash/`). Nothing reads or writes it yet
at this point beyond what the app already does going forward.

### 2. Backfill existing tokens

```bash
npm run backfill:token-hash
```

Computes `tokenHash = sha256(token)` for every existing `ApiToken` row that doesn't have
one yet. **This must run before you deploy the updated code** — the auth middleware looks
up API tokens by `tokenHash`, so any token not backfilled will start returning 401 the
moment the new code is live.

### 3. Set `CORS_ORIGINS` before deploying

Add to your deploy environment (e.g. Render) and to your local `.env`:

```
CORS_ORIGINS="https://fawedding.com.br,https://adeilta.com.br,http://localhost:5173"
```

Comma-separated, no trailing slashes. Include every real frontend origin plus whatever
local dev origins you use. **Nothing is allowed by default** — an empty/unset
`CORS_ORIGINS` means every browser-based request gets denied by CORS.

### 4. Recommended order for the actual deploy

1. Merge this branch.
2. Run step 1 (migrate) and step 2 (backfill) against production **before** the new build
   goes live, or as part of the same deploy if your pipeline runs migrations pre-boot.
3. Confirm `CORS_ORIGINS` and `NODE_ENV=production` are set in the deploy environment.
4. Deploy.
5. Smoke-test: log in, submit a test RSVP, confirm a gift payment — all through the real
   frontend origin, to confirm CORS didn't lock out a real client.

### 5. Follow-up (separate, later PR — not part of this issue)

Once the `tokenHash` lookup has been confirmed working in production for a while, drop
the plaintext `token` column in a follow-up migration. Kept for now only as a rollback
safety net, per the PRD — not meant to stay indefinitely.

## Out of scope (unchanged, by design)

- Shared/Redis-backed rate limiting (deferred until the API runs on more than one instance)
- CAPTCHA on public forms (forms are only reachable via a private, per-event `ApiToken`)
- Docker/Nginx hardening (Render buildpack deploy, no container this repo controls)
- Broader test coverage beyond the rate limiter and token hashing modules
