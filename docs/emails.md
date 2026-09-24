# Confirmation emails

How the RSVP confirmation email is built, sent, and customized per wedding. For the *why* behind the design (no queue, template per wedding), see the README sections [Direct email send, no queue](../README.md#direct-email-send-no-queue) and [Template per wedding](../README.md#template-per-wedding).

## Flow

```
POST /api/weddings/:weddingId/rsvps
  └─ RsvpService.create                     src/services/rsvp.service.ts
       ├─ prisma.rsvp.create  (emailStatus = PENDING)
       ├─ return 201 to the guest            ← never waits for the email
       └─ void sendAndTrackConfirmationEmail  (fire-and-forget)
            └─ sendConfirmationEmail          src/lib/email.tsx
                 ├─ getConfirmationEmailComponent(wedding.id)   src/emails/registry.ts
                 └─ resend.emails.send({ from, to, subject, react: <Component /> })
            └─ rsvp.update → SENT + emailSentAt   |   FAILED + emailError
```

- **Sender:** `noreply@<hostname of Wedding.siteUrl>`. The domain must be verified in Resend, otherwise the send fails with a Resend error (stored in `emailError`).
- **Subject:** `Presença Confirmada — ${wedding.name}`. It is built in `src/lib/email.tsx`, not in the template.
- **No retry.** A `FAILED` send is only retried manually: `POST /api/weddings/:weddingId/rsvps/:id/resend-email`.
- **No API key:** without `RESEND_API_KEY`, `sendConfirmationEmail` returns `{ ok: false }` and the RSVP is marked `FAILED`. The RSVP itself still succeeds.

## Files

```
src/lib/email.tsx                  Resend client, sendConfirmationEmail, renderConfirmationEmailPreview
src/emails/types.ts                ConfirmationEmailProps — what every template receives
src/emails/registry.ts             weddingId → template component, falls back to Generic
src/emails/templates/
  generic.tsx                      ConfirmationEmailLayout (all markup) + GenericConfirmationEmail
  felipe-amanda.tsx                weddingId 1
  brenda-guilherme.tsx             weddingId 2
```

### What a template receives

Every template gets the same props (`ConfirmationEmailProps`):

```ts
{ guestName: string, wedding: { name: string, date: Date, siteUrl: string } }
```

Anything else (couple names, venue, time, colors) is hardcoded in the wedding's own template file.

### `ConfirmationEmailLayout`

All the HTML lives in `generic.tsx`. A per-wedding template does not write markup; it only configures the layout:

| Prop | Required | Shown as |
|---|---|---|
| `guestName` | yes | "Obrigado, *{guestName}*!" |
| `coupleNames` | yes | Hero headline, inbox preview text, footer |
| `dateLabel` | yes | Hero subline and "Data" card, e.g. `20 de Setembro de 2026` |
| `cityLabel` | no | Appended to the hero subline: `{dateLabel} · {cityLabel}` |
| `weekdayLabel` | no | Under the date in the "Data" card |
| `timeLabel` | no | "Horário" card, e.g. `11h00` |
| `venueName` / `venueSubtitle` | no | "Local" card |
| `mapsUrl` | no | Makes the "Local" card a link |
| `siteUrl` | yes | CTA button "Ver o site do casamento" |
| `heroImageUrl` | no | Hero background (with dark overlay). Without it, the hero is a flat color |
| `palette` | yes | 7 colors: `background`, `cardBackground`, `infoCardBackground`, `textPrimary`, `textMuted`, `textFooter`, `cta` |

Some text is fixed in the layout and can't be changed per wedding. Changing it affects **every** wedding:

- "Sua presença foi confirmada. Mal podemos esperar para celebrar esse momento especial com você."
- "Início da cerimônia" (under the time)
- "Ver o site do casamento" (CTA button)

The layout assumes a couple's wedding. For another kind of event, turn these strings into optional props that default to the current text.

## Adding a template for a new wedding

1. **Get the `weddingId`.** The `Wedding` row must already exist; the registry is keyed by numeric id, not slug.
2. **Create `src/emails/templates/<slug>.tsx`** by copying an existing one:

   ```tsx
   import type { ConfirmationEmailProps } from '../types'
   import { ConfirmationEmailLayout } from './generic'

   const PALETTE = {
     background: '#f4ebdd',
     cardBackground: '#FFFFFF',
     infoCardBackground: '#e8d6b9',
     textPrimary: '#2b241c',
     textMuted: '#6b5d4f',
     textFooter: '#e2cead',
     cta: '#e87518',
   }

   export function NameNameConfirmationEmail({ guestName, wedding }: ConfirmationEmailProps) {
     return (
       <ConfirmationEmailLayout
         guestName={guestName}
         coupleNames="Name & Name"
         dateLabel="20 de Setembro de 2026"
         weekdayLabel="Domingo"
         timeLabel="11h00"
         cityLabel="São Paulo"
         venueName="…"
         venueSubtitle="…"
         mapsUrl="https://maps.app.goo.gl/…"
         siteUrl={wedding.siteUrl}
         heroImageUrl={`${wedding.siteUrl}/email-assets/hero.jpg`}
         palette={PALETTE}
       />
     )
   }
   ```

3. **Register it** in `src/emails/registry.ts`:

   ```ts
   const registry: Record<number, ConfirmationEmailComponent> = {
     1: FelipeAmandaConfirmationEmail,
     2: BrendaGuilhermeConfirmationEmail,
     4: NameNameConfirmationEmail,
   }
   ```

4. **Hero image:** by convention the image is served by the wedding's own frontend at `<siteUrl>/email-assets/hero.jpg`. It must be publicly reachable over HTTPS, because email clients fetch it when the email is opened.
5. **Preview it** (see below) and check it in light and dark mode clients.
6. **Verify the sender domain** (the `siteUrl` hostname) in Resend before the wedding goes live.

A wedding without a registered template still gets an email: `GenericConfirmationEmail` uses `wedding.name` as the headline, `wedding.date` formatted in pt-BR, and a neutral palette.

## Previewing

```
GET /api/weddings/:weddingId/rsvps/email-preview
```

Renders the wedding's template as HTML with guest name "Convidado de Teste". Nothing is sent and no RSVP is needed. It needs an authenticated actor with access to that wedding, and it returns `404` when `NODE_ENV=production`.

## Environment

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key. Unset → every send is recorded as `FAILED` |
| `NODE_ENV` | `production` disables the preview route |
