import { verify } from 'hono/jwt'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../types/hono-env'

const PUBLIC_PATHS = new Set(['/api/openapi', '/api/docs', '/api/auth/login', '/api/auth/token'])

// ApiToken actors are only ever allowed to hit this single route/verb combination.
const API_TOKEN_ALLOWED_ROUTE = /^\/api\/weddings\/\d+\/rsvps$/

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  if (PUBLIC_PATHS.has(c.req.path)) {
    return next()
  }

  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  const token = authHeader.slice(7)
  const prisma = c.get('prisma')

  if (token.includes('.')) {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new HTTPException(500, { message: 'JWT_SECRET is not configured' })
    }
    let payload: Record<string, unknown>
    try {
      payload = await verify(token, jwtSecret, 'HS256')
    } catch {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const userId = Number(payload.sub)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }

    const managedWeddings = await prisma.weddingManager.findMany({
      where: { userId: user.id },
      select: { weddingId: true },
    })

    c.set('actor', {
      kind: 'user',
      userId: user.id,
      role: user.role,
      managedWeddingIds: managedWeddings.map((m) => m.weddingId),
    })
    return next()
  }

  const apiToken = await prisma.apiToken.findUnique({
    where: { token, isActive: true },
  })

  if (!apiToken) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  if (c.req.method !== 'POST' || !API_TOKEN_ALLOWED_ROUTE.test(c.req.path)) {
    throw new HTTPException(403, { message: 'Forbidden' })
  }

  c.set('actor', {
    kind: 'apiToken',
    apiTokenId: apiToken.id,
    weddingId: apiToken.weddingId,
  })

  return next()
})
