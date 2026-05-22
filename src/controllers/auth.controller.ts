import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { describeRoute } from 'hono-openapi'
import { validator } from 'hono-openapi/zod'
import { mapResponses } from '../lib/openapi'
import type { AppEnv } from '../types/hono-env'
import { AuthRequestSchema, AuthResponseSchema } from '../schemas/auth.schema'
import { createAuthService } from '../services/auth.service'

export const authController = new Hono<AppEnv>()

authController.post(
  '/login',
  describeRoute({
    summary: 'Admin login',
    description: 'Authenticates an admin user with email and password. Returns a signed JWT (1 hour expiry) and the user profile.',
    tags: ['Auth'],
    responses: mapResponses({
      schema: AuthResponseSchema.LOGIN,
      successMessage: 'Login successful',
    }),
  }),
  validator('json', AuthRequestSchema.LOGIN),
  async (c) => {
    const body = c.req.valid('json')
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new HTTPException(500, { message: 'JWT_SECRET is not configured' })
    }
    const service = createAuthService(c)
    const data = await service.login(body, jwtSecret)
    return c.json({ data })
  },
)
