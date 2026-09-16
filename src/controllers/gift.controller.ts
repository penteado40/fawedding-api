import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { describeRoute } from 'hono-openapi'
import { resolver, validator } from 'hono-openapi/zod'
import { mapResponses } from '../lib/openapi'
import { zodErrorHook } from '../lib/validation'
import type { AppEnv } from '../types/hono-env'
import { GiftRequestSchema, GiftResponseSchema } from '../schemas/gift.schema'
import type { UpdateGiftInput } from '../services/gift.service'
import { createGiftService } from '../services/gift.service'
import { createWeddingAccessService } from '../services/wedding-access.service'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

async function readImageFile(file: File): Promise<{ buffer: Buffer; filename: string }> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new HTTPException(400, { message: 'Image must be one of: image/jpeg, image/png, image/webp, image/gif' })
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new HTTPException(400, { message: 'Image must be 5MB or smaller' })
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  return { buffer, filename: file.name }
}

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
  validator('query', GiftRequestSchema.SEARCH, zodErrorHook),
  async (c) => {
    const search = c.req.valid('query')
    const actor = c.get('actor')
    const service = createGiftService(c)

    let restrictToWeddingIds: number[] | undefined
    if (actor.kind === 'user' && actor.role !== 'SUPER_ADMIN') {
      if (search.weddingId !== undefined) {
        createWeddingAccessService(c).assertCanAccessWedding(actor, search.weddingId)
      } else {
        restrictToWeddingIds = actor.managedWeddingIds
      }
    }

    const data = await service.list(search, restrictToWeddingIds)
    return c.json({ data })
  },
)

giftController.post(
  '/',
  describeRoute({
    summary: 'Create gift',
    description:
      'Adds a new gift item via multipart/form-data with name, price and image file. The image is uploaded to Cloudinary; accepted types are image/jpeg, image/png, image/webp, image/gif, up to 5MB.',
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
  validator('form', GiftRequestSchema.CREATE_FORM, zodErrorHook),
  async (c) => {
    const body = c.req.valid('form')
    const actor = c.get('actor')
    createWeddingAccessService(c).assertCanAccessWedding(actor, body.weddingId)

    const formData = await c.req.parseBody()
    const imageFile = formData['image']

    const image = imageFile instanceof File ? await readImageFile(imageFile) : undefined

    const service = createGiftService(c)
    const data = await service.create(body, image)
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
  validator('param', GiftRequestSchema.GET, zodErrorHook),
  async (c) => {
    const { id } = c.req.valid('param')
    const actor = c.get('actor')
    const service = createGiftService(c)
    const data = await service.getById(actor, id)
    return c.json({ data })
  },
)

giftController.put(
  '/:id',
  describeRoute({
    summary: 'Update gift',
    description:
      'Updates an existing gift via multipart/form-data. Omitted fields are left unchanged. Omitting image keeps the existing one; sending a new image uploads it to Cloudinary and replaces the previous one there.',
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
  validator('param', GiftRequestSchema.GET, zodErrorHook),
  validator('form', GiftRequestSchema.UPDATE_FORM, zodErrorHook),
  async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('form')
    const actor = c.get('actor')
    const formData = await c.req.parseBody()
    const imageFile = formData['image']

    const patch: UpdateGiftInput = {
      name: body.name,
      description: body.description,
      price: body.price,
    }

    const image = imageFile instanceof File ? await readImageFile(imageFile) : undefined

    const service = createGiftService(c)
    const data = await service.update(actor, id, patch, image)
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
  validator('param', GiftRequestSchema.DELETE, zodErrorHook),
  async (c) => {
    const { id } = c.req.valid('param')
    const actor = c.get('actor')
    const service = createGiftService(c)
    const data = await service.delete(actor, id)
    return c.json({ data })
  },
)
