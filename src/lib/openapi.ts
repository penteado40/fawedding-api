import { resolver } from 'hono-openapi/zod'
import type { ZodType } from 'zod'

export function mapResponses(input: {
  schema: ZodType
  successMessage: string
  status?: number
}) {
  const code = String(input.status ?? 200)
  return {
    [code]: {
      description: input.successMessage,
      content: {
        'application/json': {
          schema: resolver(input.schema),
        },
      },
    },
  }
}
