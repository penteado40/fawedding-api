import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../types/hono-env'

const PUBLIC_PATHS = new Set(['/api/openapi', '/api/docs'])

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
  const apiToken = await prisma.apiToken.findUnique({
    where: { token, isActive: true },
  })

  if (!apiToken) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  return next()
})
