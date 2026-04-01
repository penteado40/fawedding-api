import { Scalar } from '@scalar/hono-api-reference'
import type { Hono } from 'hono'
import { openAPISpecs } from 'hono-openapi'
import type { AppEnv } from '../types/hono-env'

export function startDocs(app: Hono<AppEnv>) {
  app.get(
    '/openapi',
    openAPISpecs(app as unknown as Hono, {
      documentation: {
        openapi: '3.1.0',
        info: {
          title: 'FAWedding API',
          version: '1.0.0',
          description: 'API do ecossistema FAWedding — lista de presentes, convidados e RSVP.',
        },
        servers: [
          {
            url: 'http://localhost:3000/api',
            description: 'Local',
          },
        ],
      },
    }),
  )

  app.get(
    '/docs',
    Scalar({
      theme: 'saturn',
      url: '/api/openapi',
    }),
  )
}
