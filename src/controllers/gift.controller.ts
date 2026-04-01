import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver, validator } from 'hono-openapi/zod'
import { mapResponses } from '../lib/openapi'
import type { AppEnv } from '../types/hono-env'
import { GiftRequestSchema, GiftResponseSchema } from '../schemas/gift.schema'
import { createGiftService } from '../services/gift.service'

export const giftController = new Hono<AppEnv>()

giftController.get(
  '/gifts',
  describeRoute({
    summary: 'List gifts',
    description:
      'Returns all items on the wedding gift list. Optionally filter by name (case-insensitive partial match).',
    tags: ['Gifts'],
    responses: mapResponses({
      schema: GiftResponseSchema.COLLECTION,
      successMessage: 'Gifts listed successfully',
    }),
  }),
  validator('query', GiftRequestSchema.SEARCH),
  async (c) => {
    const search = c.req.valid('query')
    const service = createGiftService(c)
    const data = await service.list(search)
    return c.json({ data })
  },
)

giftController.post(
  '/gifts',
  describeRoute({
    summary: 'Create gift',
    description: 'Adds a new gift item with name, image URL, Amazon link and price.',
    tags: ['Gifts'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: resolver(GiftRequestSchema.CREATE),
        },
      },
    },
    responses: mapResponses({
      schema: GiftResponseSchema.SINGLE,
      successMessage: 'Gift created successfully',
      status: 201,
    }),
  }),
  validator('json', GiftRequestSchema.CREATE),
  async (c) => {
    const body = c.req.valid('json')
    const service = createGiftService(c)
    const data = await service.create(body)
    return c.json({ data }, 201)
  },
)

giftController.get(
  '/gifts/:id',
  describeRoute({
    summary: 'Get gift by id',
    description: 'Returns a single gift item by UUID.',
    tags: ['Gifts'],
    responses: mapResponses({
      schema: GiftResponseSchema.SINGLE,
      successMessage: 'Gift found successfully',
    }),
  }),
  validator('param', GiftRequestSchema.GET),
  async (c) => {
    const { id } = c.req.valid('param')
    const service = createGiftService(c)
    const data = await service.getById(id)
    return c.json({ data })
  },
)

giftController.put(
  '/gifts/:id',
  describeRoute({
    summary: 'Update gift',
    description: 'Updates an existing gift. Omitted fields are left unchanged.',
    tags: ['Gifts'],
    requestBody: {
      required: false,
      content: {
        'application/json': {
          schema: resolver(GiftRequestSchema.UPDATE),
        },
      },
    },
    responses: mapResponses({
      schema: GiftResponseSchema.SINGLE,
      successMessage: 'Gift updated successfully',
    }),
  }),
  validator('param', GiftRequestSchema.GET),
  validator('json', GiftRequestSchema.UPDATE),
  async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const service = createGiftService(c)
    const data = await service.update(id, body)
    return c.json({ data })
  },
)

giftController.delete(
  '/gifts/:id',
  describeRoute({
    summary: 'Delete gift',
    description: 'Removes a gift from the list and returns the deleted record.',
    tags: ['Gifts'],
    responses: mapResponses({
      schema: GiftResponseSchema.SINGLE,
      successMessage: 'Gift deleted successfully',
    }),
  }),
  validator('param', GiftRequestSchema.DELETE),
  async (c) => {
    const { id } = c.req.valid('param')
    const service = createGiftService(c)
    const data = await service.delete(id)
    return c.json({ data })
  },
)
