import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { validator } from 'hono-openapi/zod'
import { mapResponses } from '../lib/openapi'
import { zodErrorHook } from '../lib/validation'
import type { AppEnv } from '../types/hono-env'
import { WeddingIdParamSchema } from '../schemas/wedding.schema'
import { GiftRequestSchema, GiftResponseSchema } from '../schemas/gift.schema'
import { createGiftService } from '../services/gift.service'
import { createWeddingAccessService } from '../services/wedding-access.service'

export const weddingGiftController = new Hono<AppEnv>()

weddingGiftController.get(
  '/',
  describeRoute({
    summary: 'List gifts for wedding',
    description: 'Returns all gifts belonging to this wedding.',
    tags: ['Gifts'],
    responses: mapResponses({
      schema: GiftResponseSchema.COLLECTION,
      successMessage: 'Gifts listed successfully',
    }),
  }),
  validator('param', WeddingIdParamSchema, zodErrorHook),
  async (c) => {
    const { weddingId } = c.req.valid('param')
    const actor = c.get('actor')
    const accessService = createWeddingAccessService(c)
    accessService.assertCanAccessWedding(actor, weddingId)

    const service = createGiftService(c)
    const data = await service.listForWedding(weddingId)
    return c.json({ data })
  },
)

weddingGiftController.get(
  '/:id',
  describeRoute({
    summary: 'Get gift by id for wedding',
    description: 'Returns a single gift by id. 404 if it does not exist or belongs to a different wedding.',
    tags: ['Gifts'],
    responses: mapResponses({
      schema: GiftResponseSchema.SINGLE,
      successMessage: 'Gift found successfully',
    }),
  }),
  validator('param', GiftRequestSchema.WEDDING_GET, zodErrorHook),
  async (c) => {
    const { weddingId, id } = c.req.valid('param')
    const actor = c.get('actor')
    const accessService = createWeddingAccessService(c)
    accessService.assertCanAccessWedding(actor, weddingId)

    const service = createGiftService(c)
    const data = await service.getByIdForWedding(weddingId, id)
    return c.json({ data })
  },
)
