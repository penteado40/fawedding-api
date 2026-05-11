import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { validator } from 'hono-openapi/zod'
import { mapResponses } from '../lib/openapi'
import type { AppEnv } from '../types/hono-env'
import { ApiTokenRequestSchema, ApiTokenResponseSchema } from '../schemas/api-token.schema'
import { createApiTokenService } from '../services/api-token.service'

export const apiTokenController = new Hono<AppEnv>()

apiTokenController.get(
  '/',
  describeRoute({
    summary: 'List API tokens',
    description: 'Returns all API tokens (metadata only — token value is never returned in listings).',
    tags: ['API Tokens'],
    responses: mapResponses({
      schema: ApiTokenResponseSchema.COLLECTION,
      successMessage: 'API tokens listed successfully',
    }),
  }),
  validator('query', ApiTokenRequestSchema.SEARCH),
  async (c) => {
    const search = c.req.valid('query')
    const service = createApiTokenService(c)
    const data = await service.list(search)
    return c.json({ data })
  },
)

apiTokenController.post(
  '/',
  describeRoute({
    summary: 'Create API token',
    description: 'Creates a new API token. The token value is returned only in this response — store it securely.',
    tags: ['API Tokens'],
    responses: mapResponses({
      schema: ApiTokenResponseSchema.SINGLE_WITH_TOKEN,
      successMessage: 'API token created successfully',
      status: 201,
    }),
  }),
  validator('json', ApiTokenRequestSchema.CREATE),
  async (c) => {
    const body = c.req.valid('json')
    const service = createApiTokenService(c)
    const data = await service.create(body)
    return c.json({ data }, 201)
  },
)

apiTokenController.get(
  '/:id',
  describeRoute({
    summary: 'Get API token by id',
    description: 'Returns a single API token metadata by ID (token value not included).',
    tags: ['API Tokens'],
    responses: mapResponses({
      schema: ApiTokenResponseSchema.SINGLE,
      successMessage: 'API token found successfully',
    }),
  }),
  validator('param', ApiTokenRequestSchema.GET),
  async (c) => {
    const { id } = c.req.valid('param')
    const service = createApiTokenService(c)
    const data = await service.getById(id)
    return c.json({ data })
  },
)

apiTokenController.put(
  '/:id',
  describeRoute({
    summary: 'Update API token',
    description: 'Updates the name or active status of an API token.',
    tags: ['API Tokens'],
    responses: mapResponses({
      schema: ApiTokenResponseSchema.SINGLE,
      successMessage: 'API token updated successfully',
    }),
  }),
  validator('param', ApiTokenRequestSchema.GET),
  validator('json', ApiTokenRequestSchema.UPDATE),
  async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const service = createApiTokenService(c)
    const data = await service.update(id, body)
    return c.json({ data })
  },
)

apiTokenController.delete(
  '/:id',
  describeRoute({
    summary: 'Delete API token',
    description: 'Permanently removes an API token. Active requests using this token will be rejected immediately.',
    tags: ['API Tokens'],
    responses: mapResponses({
      schema: ApiTokenResponseSchema.SINGLE,
      successMessage: 'API token deleted successfully',
    }),
  }),
  validator('param', ApiTokenRequestSchema.DELETE),
  async (c) => {
    const { id } = c.req.valid('param')
    const service = createApiTokenService(c)
    const data = await service.delete(id)
    return c.json({ data })
  },
)
