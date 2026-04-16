import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { validator } from 'hono-openapi/zod'
import { mapResponses } from '../lib/openapi'
import type { AppEnv } from '../types/hono-env'
import { RsvpRequestSchema, RsvpResponseSchema } from '../schemas/rsvp.schema'
import { createRsvpService } from '../services/rsvp.service'

export const rsvpController = new Hono<AppEnv>()

rsvpController.get(
  '/',
  describeRoute({
    summary: 'List RSVPs',
    description:
      'Returns all RSVPs. Optionally filter by status (PENDING, CONFIRMED, DECLINED).',
    tags: ['RSVPs'],
    responses: mapResponses({
      schema: RsvpResponseSchema.COLLECTION,
      successMessage: 'RSVPs listed successfully',
    }),
  }),
  validator('query', RsvpRequestSchema.SEARCH),
  async (c) => {
    const search = c.req.valid('query')
    const service = createRsvpService(c)
    const data = await service.list(search)
    return c.json({ data })
  },
)

rsvpController.post(
  '/',
  describeRoute({
    summary: 'Create RSVP',
    description:
      'Registers a new RSVP with status PENDING. Email must be unique — returns 409 if already registered.',
    tags: ['RSVPs'],
    responses: mapResponses({
      schema: RsvpResponseSchema.SINGLE,
      successMessage: 'RSVP created successfully',
      status: 201,
    }),
  }),
  validator('json', RsvpRequestSchema.CREATE),
  async (c) => {
    const body = c.req.valid('json')
    const service = createRsvpService(c)
    const data = await service.create(body)
    return c.json({ data }, 201)
  },
)
