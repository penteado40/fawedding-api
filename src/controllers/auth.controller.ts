import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { describeRoute } from 'hono-openapi'
import { validator } from 'hono-openapi/zod'
import { mapResponses } from '../lib/openapi'
import { zodErrorHook } from '../lib/validation'
import type { AppEnv } from '../types/hono-env'
import { AuthRequestSchema, AuthResponseSchema } from '../schemas/auth.schema'
import { createAuthService } from '../services/auth.service'

const ONE_HOUR_SECONDS = 3600

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
  validator('json', AuthRequestSchema.LOGIN, zodErrorHook),
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

// OAuth2 password flow adapter — used exclusively by the Scalar docs UI to exchange
// credentials for a bearer token. Returns the standard OAuth2 token response (no { data } wrapper).
authController.post(
  '/token',
  describeRoute({
    summary: 'OAuth2 token (docs only)',
    description: 'OAuth2 password grant adapter for the Scalar docs UI. Not intended for direct API clients — use /login instead.',
    tags: ['Auth'],
    responses: mapResponses({
      schema: AuthResponseSchema.TOKEN,
      successMessage: 'Token issued',
    }),
  }),
  validator('form', AuthRequestSchema.TOKEN, zodErrorHook),
  async (c) => {
    const { username, password } = c.req.valid('form')
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new HTTPException(500, { message: 'JWT_SECRET is not configured' })
    }
    const service = createAuthService(c)
    const { token } = await service.login({ email: username, password }, jwtSecret)
    return c.json({
      access_token: token,
      token_type: 'bearer' as const,
      expires_in: ONE_HOUR_SECONDS,
    })
  },
)
