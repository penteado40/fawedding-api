import { resolver } from 'hono-openapi/zod'
import * as z from 'zod'

export function mapResponses(params?: {
  schema?: z.ZodType
  successMessage?: string
  notFoundMessage?: string
  badRequestMessage?: string
  serverErrorMessage?: string
}) {
  return {
    200: {
      description: params?.successMessage || 'Successful response',
      ...(params?.schema
        ? {
            content: {
              'application/json': {
                schema: resolver(params.schema),
              },
            },
          }
        : {}),
    },
    400: {
      description: params?.badRequestMessage || 'Bad Request',
      content: {
        'application/json': {
          schema: resolver(
            z.object({
              message: z.string(),
              errors: z.array(
                z.object({
                  code: z.string(),
                  message: z.string(),
                  path: z.array(z.string()),
                }),
              ),
            }),
          ),
        },
      },
    },
    404: {
      description: params?.notFoundMessage || 'Not Found',
      content: {
        'application/json': {
          schema: resolver(
            z.object({
              message: z.string(),
            }),
          ),
        },
      },
    },
    500: {
      description: params?.serverErrorMessage || 'Internal Server Error',
      content: {
        'application/json': {
          schema: resolver(
            z.object({
              message: z.string(),
            }),
          ),
        },
      },
    },
  }
}
