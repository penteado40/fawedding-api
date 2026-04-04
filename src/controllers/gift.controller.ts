import * as fs from 'node:fs'
import * as path from 'node:path'
import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver, validator } from 'hono-openapi/zod'
import { getMimeType } from 'hono/utils/mime'
import { mapResponses } from '../lib/openapi'
import type { AppEnv } from '../types/hono-env'
import { GiftRequestSchema, GiftResponseSchema } from '../schemas/gift.schema'
import type { UpdateGiftRequest } from '../models/gift.model'
import { createGiftService } from '../services/gift.service'

const uploadsDir = path.join(process.cwd(), 'uploads')

export const giftController = new Hono<AppEnv>()

giftController.get(
  '/uploads/:filename',
  describeRoute({
    summary: 'Get gift image',
    description: 'Returns the image file stored in uploads/. The frontend should build the URL by concatenating the API base URL with the filename saved in the database.',
    tags: ['Gifts'],
    responses: {
      200: {
        description: 'Image file',
        content: { 'image/*': { schema: { type: 'string', format: 'binary' } } },
      },
      404: {
        description: 'Image not found',
        content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } },
      },
    },
  }),
  validator('param', GiftRequestSchema.UPLOADS),
  async (c) => {
    const { filename } = c.req.valid('param')
    const filePath = path.join(uploadsDir, filename)

    if (!fs.existsSync(filePath)) {
      return c.json({ message: 'Image not found' }, 404)
    }

    const mimeType = getMimeType(filename) ?? 'application/octet-stream'
    const buffer = fs.readFileSync(filePath)
    return c.body(buffer, 200, { 'Content-Type': mimeType })
  },
)

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
    description: 'Updates an existing gift via multipart/form-data. Omitted fields are left unchanged. Omitting image keeps the existing file.',
    tags: ['Gifts'],
    requestBody: {
      required: false,
      content: {
        'multipart/form-data': {
          schema: resolver(GiftRequestSchema.UPDATE_FORM),
        },
      },
    },
    responses: mapResponses({
      schema: GiftResponseSchema.SINGLE,
      successMessage: 'Gift updated successfully',
    }),
  }),
  validator('param', GiftRequestSchema.GET),
  validator('form', GiftRequestSchema.UPDATE_FORM),
  async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('form')
    const formData = await c.req.parseBody()
    const imageFile = formData['image']

    const patch: UpdateGiftRequest = {
      name: body.name,
      price: body.price,
      amazonLink: body.amazonLink,
    }

    if (imageFile instanceof File) {
      const filename = `${randomUUID()}-${imageFile.name}`
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      fs.writeFileSync(path.join(uploadsDir, filename), buffer)
      patch.image = filename
    }

    const service = createGiftService(c)
    const data = await service.update(id, patch)
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
