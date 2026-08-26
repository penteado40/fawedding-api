import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { validator } from 'hono-openapi/zod'
import { mapResponses } from '../lib/openapi'
import { zodErrorHook } from '../lib/validation'
import type { AppEnv } from '../types/hono-env'
import {
  WeddingManagerRequestSchema,
  WeddingManagerResponseSchema,
  WeddingRequestSchema,
  WeddingResponseSchema,
} from '../schemas/wedding.schema'
import { createWeddingService } from '../services/wedding.service'
import { createWeddingManagerService } from '../services/wedding-manager.service'
import { createWeddingAccessService } from '../services/wedding-access.service'
import { rsvpController } from './rsvp.controller'

export const weddingController = new Hono<AppEnv>()

weddingController.get(
  '/',
  describeRoute({
    summary: 'List weddings',
    description:
      'Returns weddings visible to the caller. SUPER_ADMIN sees all weddings; a regular user sees only weddings they manage.',
    tags: ['Weddings'],
    responses: mapResponses({
      schema: WeddingResponseSchema.COLLECTION,
      successMessage: 'Weddings listed successfully',
    }),
  }),
  async (c) => {
    const actor = c.get('actor')
    const service = createWeddingService(c)
    const data = await service.list(actor)
    return c.json({ data })
  },
)

weddingController.post(
  '/',
  describeRoute({
    summary: 'Create wedding',
    description: 'Creates a new wedding (tenant). Requires SUPER_ADMIN.',
    tags: ['Weddings'],
    responses: mapResponses({
      schema: WeddingResponseSchema.SINGLE,
      successMessage: 'Wedding created successfully',
      status: 201,
    }),
  }),
  validator('json', WeddingRequestSchema.CREATE, zodErrorHook),
  async (c) => {
    const actor = c.get('actor')
    const accessService = createWeddingAccessService(c)
    accessService.assertCanManagePlatform(actor)

    const body = c.req.valid('json')
    const service = createWeddingService(c)
    const data = await service.create(body)
    return c.json({ data }, 201)
  },
)

weddingController.get(
  '/:id',
  describeRoute({
    summary: 'Get wedding by id',
    description: 'Returns a single wedding by id. Requires access to the wedding.',
    tags: ['Weddings'],
    responses: mapResponses({
      schema: WeddingResponseSchema.SINGLE,
      successMessage: 'Wedding found successfully',
    }),
  }),
  validator('param', WeddingRequestSchema.PARAM, zodErrorHook),
  async (c) => {
    const { id } = c.req.valid('param')
    const actor = c.get('actor')
    const accessService = createWeddingAccessService(c)
    accessService.assertCanAccessWedding(actor, id)

    const service = createWeddingService(c)
    const data = await service.getById(id)
    return c.json({ data })
  },
)

weddingController.post(
  '/:id/managers',
  describeRoute({
    summary: 'Assign wedding manager',
    description: 'Links an existing user as a manager of this wedding. Requires SUPER_ADMIN.',
    tags: ['Weddings'],
    responses: mapResponses({
      schema: WeddingManagerResponseSchema.SINGLE,
      successMessage: 'Wedding manager assigned successfully',
      status: 201,
    }),
  }),
  validator('param', WeddingManagerRequestSchema.ASSIGN_PARAM, zodErrorHook),
  validator('json', WeddingManagerRequestSchema.ASSIGN_BODY, zodErrorHook),
  async (c) => {
    const actor = c.get('actor')
    const accessService = createWeddingAccessService(c)
    accessService.assertCanManagePlatform(actor)

    const { id } = c.req.valid('param')
    const { userId } = c.req.valid('json')
    const service = createWeddingManagerService(c)
    const data = await service.assign(id, userId)
    return c.json({ data }, 201)
  },
)

weddingController.delete(
  '/:id/managers/:userId',
  describeRoute({
    summary: 'Remove wedding manager',
    description: 'Removes a user as a manager of this wedding. Requires SUPER_ADMIN.',
    tags: ['Weddings'],
    responses: mapResponses({
      schema: WeddingManagerResponseSchema.SINGLE,
      successMessage: 'Wedding manager removed successfully',
    }),
  }),
  validator('param', WeddingManagerRequestSchema.REMOVE_PARAM, zodErrorHook),
  async (c) => {
    const actor = c.get('actor')
    const accessService = createWeddingAccessService(c)
    accessService.assertCanManagePlatform(actor)

    const { id, userId } = c.req.valid('param')
    const service = createWeddingManagerService(c)
    const data = await service.remove(id, userId)
    return c.json({ data })
  },
)

weddingController.route('/:weddingId/rsvps', rsvpController)
