import { verify } from 'hono/jwt'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../types/hono-env'

const PUBLIC_PATHS = new Set(['/api/openapi', '/api/docs', '/api/auth/login'])

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  if (PUBLIC_PATHS.has(c.req.path)) {
    return next()
  }

  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  const token = authHeader.slice(7)

  if (token.includes('.')) {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new HTTPException(500, { message: 'JWT_SECRET is not configured' })
    }
    try {
      await verify(token, jwtSecret, 'HS256')
    } catch {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }
    return next()
  }

  const prisma = c.get('prisma')
  const apiToken = await prisma.apiToken.findUnique({
    where: { token, isActive: true },
  })

  if (!apiToken) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  return next()
})
