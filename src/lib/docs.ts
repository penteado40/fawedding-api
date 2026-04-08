import { Scalar } from '@scalar/hono-api-reference'
import type { Hono } from 'hono'
import { openAPISpecs } from 'hono-openapi'
import type { AppEnv } from '../types/hono-env'

export function startDocs(app: Hono<AppEnv>) {
  const isProduction = process.env.NODE_ENV === 'production'
  const serverUrl = isProduction
    ? process.env.API_URL ?? 'https://fawedding-api.onrender.com/'
    : `http://localhost:${process.env.PORT ?? 3000}`
    
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
            url: serverUrl,
            description: isProduction ? 'Produção' : 'Local',
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
