import type { SQSEvent, SQSBatchResponse } from 'aws-lambda'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { z } from 'zod'
import { renderEmailHtml } from './email/confirmation'

const RsvpEmailPayloadSchema = z.object({
  name: z.string(),
  email: z.string().email(),
})

// Fail-fast: se FROM_EMAIL não estiver configurado, a Lambda falha no cold start
const FROM_EMAIL = process.env.FROM_EMAIL
if (!FROM_EMAIL) throw new Error('FROM_EMAIL is not configured')

const ses = new SESClient({ region: 'us-east-2' })

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchResponse['batchItemFailures'] = []

  for (const record of event.Records) {
    try {
      const payload = RsvpEmailPayloadSchema.parse(JSON.parse(record.body))
      const html = await renderEmailHtml({ name: payload.name })

      await ses.send(
        new SendEmailCommand({
          Source: FROM_EMAIL,
          Destination: { ToAddresses: [payload.email] },
          Message: {
            Subject: {
              Data: 'Presença Confirmada — Felipe & Amanda · 28 de Maio de 2026',
              Charset: 'UTF-8',
            },
            Body: {
              Html: { Data: html, Charset: 'UTF-8' },
            },
          },
        }),
      )

      console.log(`[handler] email sent to ${payload.email}`)
    } catch (err) {
      console.error(`[handler] failed to process record ${record.messageId}:`, err)
      batchItemFailures.push({ itemIdentifier: record.messageId })
    }
  }

  return { batchItemFailures }
}
