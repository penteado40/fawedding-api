import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { getPrisma } from './lib/prisma'
import { startDocs } from './lib/docs'
import { formatZodError } from './lib/validation'
import { matchAllowedOrigin } from './lib/cors-config'
import { authMiddleware } from './middlewares/auth.middleware'
import { authController } from './controllers/auth.controller'
import { giftController } from './controllers/gift.controller'
import { weddingController } from './controllers/wedding.controller'
import { apiTokenController } from './controllers/api-token.controller'
import type { AppEnv } from './types/hono-env'

export const app = new Hono<AppEnv>().basePath('/api')

app.use(secureHeaders())

app.use(async (c, next) => {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new HTTPException(500, { message: 'DATABASE_URL is not configured' })
  }
  c.set('prisma', getPrisma(url))
  await next()
})

app.use(
  '*',
  cors({
    origin: matchAllowedOrigin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
  }),
)

app.use('*', authMiddleware)

startDocs(app)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    c.status(err.status)
    return c.json({ errors: err.message })
  }
  if (err instanceof z.ZodError) {
    c.status(400)
    return c.json({ errors: formatZodError(err) })
  }
  console.error(err)
  c.status(500)
  const isProduction = process.env.NODE_ENV === 'production'
  const message = !isProduction && err instanceof Error ? err.message : 'Internal Server Error'
  return c.json({ errors: message })
})

app.route('/auth', authController)
app.route('/gifts', giftController)
app.route('/weddings', weddingController)
app.route('/api-tokens', apiTokenController)


export default app
