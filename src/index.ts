import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { getPrisma } from './lib/prisma'
import { startDocs } from './lib/docs'
import { routes } from './routes'
import type { AppEnv } from './types/hono-env'

export const app = new Hono<AppEnv>().basePath('/api')

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
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
)

startDocs(app)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    c.status(err.status)
    return c.json({ errors: err.message })
  }
  if (err instanceof z.ZodError) {
    c.status(400)
    return c.json({ errors: err.message })
  }
  console.error(err)
  c.status(500)
  return c.json({ errors: err instanceof Error ? err.message : 'Internal Server Error' })
})

app.route('/', routes)


export default app
