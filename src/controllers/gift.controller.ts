import * as fs from 'node:fs'
import * as path from 'node:path'
import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { describeRoute } from 'hono-openapi'
import { resolver, validator } from 'hono-openapi/zod'
import { mapResponses } from '../lib/openapi'
import type { AppEnv } from '../types/hono-env'
import { GiftRequestSchema, GiftResponseSchema } from '../schemas/gift.schema'
import { createGiftService } from '../services/gift.service'

const uploadsDir = path.join(process.cwd(), 'uploads')

export const giftController = new Hono<AppEnv>()

giftController.get(
  '/',
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
  '/',
  describeRoute({
    summary: 'Create gift',
    description: 'Adds a new gift item via multipart/form-data with name, price, optional Amazon link and image file.',
    tags: ['Gifts'],
    requestBody: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: resolver(GiftRequestSchema.CREATE_FORM),
        },
      },
    },
    responses: mapResponses({
      schema: GiftResponseSchema.SINGLE,
      successMessage: 'Gift created successfully',
      status: 201,
    }),
  }),
  validator('form', GiftRequestSchema.CREATE_FORM),
  async (c) => {
    const body = c.req.valid('form')
    const formData = await c.req.parseBody()
    const imageFile = formData['image']

    let image: string | null = null
    if (imageFile instanceof File) {
      const filename = `${randomUUID()}-${imageFile.name}`
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      fs.writeFileSync(path.join(uploadsDir, filename), buffer)
      image = filename
    }

    const service = createGiftService(c)
    const data = await service.create({ ...body, image })
    return c.json({ data }, 201)
  },
)

giftController.get(
  '/:id',
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
  '/:id',
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
  '/:id',
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
