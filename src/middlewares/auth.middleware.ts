import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../types/hono-env'

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const path = c.req.path
  if (path === '/api/openapi' || path === '/api/docs') {
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
