import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { z } from 'zod'

const RsvpEmailPayloadSchema = z.object({
  name: z.string(),
  email: z.string().email(),
})

export type RsvpEmailPayload = z.infer<typeof RsvpEmailPayloadSchema>

const client = new SQSClient({ region: 'us-east-1' })

export async function publishRsvpConfirmation(payload: RsvpEmailPayload): Promise<void> {
  const queueUrl = process.env.SQS_QUEUE_URL
  if (!queueUrl) {
    console.error('[SQS] SQS_QUEUE_URL is not configured — skipping email notification')
    return
  }

  try {
    const validated = RsvpEmailPayloadSchema.parse(payload)
    await client.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(validated),
      }),
    )
  } catch (err) {
    console.error('[SQS] Failed to publish RSVP confirmation:', err)
  }
}
