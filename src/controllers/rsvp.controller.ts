import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { validator } from 'hono-openapi/zod'
import { mapResponses } from '../lib/openapi'
import { zodErrorHook } from '../lib/validation'
import type { AppEnv } from '../types/hono-env'
import { WeddingIdParamSchema } from '../schemas/wedding.schema'
import { RsvpRequestSchema, RsvpResponseSchema } from '../schemas/rsvp.schema'
import { createRsvpService } from '../services/rsvp.service'
import { createWeddingAccessService } from '../services/wedding-access.service'

export const rsvpController = new Hono<AppEnv>()

rsvpController.get(
  '/',
  describeRoute({
    summary: 'List RSVPs',
    description:
      'Returns all RSVPs for the wedding. Optionally filter by status (PENDING, CONFIRMED, DECLINED).',
    tags: ['RSVPs'],
    responses: mapResponses({
      schema: RsvpResponseSchema.COLLECTION,
      successMessage: 'RSVPs listed successfully',
    }),
  }),
  validator('param', WeddingIdParamSchema, zodErrorHook),
  validator('query', RsvpRequestSchema.SEARCH, zodErrorHook),
  async (c) => {
    const { weddingId } = c.req.valid('param')
    const actor = c.get('actor')
    const accessService = createWeddingAccessService(c)
    accessService.assertCanAccessWedding(actor, weddingId)

    const search = c.req.valid('query')
    const service = createRsvpService(c)
    const data = await service.list(weddingId, search)
    return c.json({ data })
  },
)

rsvpController.post(
  '/',
  describeRoute({
    summary: 'Create RSVP',
    description:
      'Registers a new RSVP for the wedding with status CONFIRMED. Email must be unique within the wedding — returns 409 if already registered.',
    tags: ['RSVPs'],
    responses: mapResponses({
      schema: RsvpResponseSchema.SINGLE,
      successMessage: 'RSVP created successfully',
      status: 201,
    }),
  }),
  validator('param', WeddingIdParamSchema, zodErrorHook),
  validator('json', RsvpRequestSchema.CREATE, zodErrorHook),
  async (c) => {
    const { weddingId } = c.req.valid('param')
    const actor = c.get('actor')
    const accessService = createWeddingAccessService(c)
    accessService.assertCanAccessWedding(actor, weddingId)

    const body = c.req.valid('json')
    const service = createRsvpService(c)
    const data = await service.create(weddingId, body)
    return c.json({ data }, 201)
  },
)
