import { Resend } from 'resend'
import { render } from '@react-email/render'
import type { Rsvp, Wedding } from '@prisma/client'
import { getConfirmationEmailComponent } from '../emails/registry'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

export type SendResult = { ok: true } | { ok: false; error: string }

function senderFromSiteUrl(siteUrl: string): string {
  const hostname = new URL(siteUrl).hostname
  return `noreply@${hostname}`
}

export async function sendConfirmationEmail(rsvp: Pick<Rsvp, 'name' | 'email'>, wedding: Wedding): Promise<SendResult> {
  if (!resend) {
    return { ok: false, error: 'RESEND_API_KEY is not configured' }
  }

  const Component = getConfirmationEmailComponent(wedding.id)

  try {
    const { error } = await resend.emails.send({
      from: senderFromSiteUrl(wedding.siteUrl),
      to: rsvp.email,
      subject: `Presença Confirmada — ${wedding.name}`,
      react: <Component guestName={rsvp.name} wedding={{ name: wedding.name, date: wedding.date, siteUrl: wedding.siteUrl }} />,
    })
    if (error) {
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function renderConfirmationEmailPreview(guestName: string, wedding: Wedding): Promise<string> {
  const Component = getConfirmationEmailComponent(wedding.id)
  return render(
    <Component guestName={guestName} wedding={{ name: wedding.name, date: wedding.date, siteUrl: wedding.siteUrl }} />,
  )
}
