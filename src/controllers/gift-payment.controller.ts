import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { validator } from 'hono-openapi/zod'
import { mapResponses } from '../lib/openapi'
import { zodErrorHook } from '../lib/validation'
import type { AppEnv } from '../types/hono-env'
import { WeddingIdParamSchema } from '../schemas/wedding.schema'
import { GiftPaymentRequestSchema, GiftPaymentResponseSchema } from '../schemas/gift-payment.schema'
import { createGiftPaymentService } from '../services/gift-payment.service'
import { createWeddingAccessService } from '../services/wedding-access.service'
import { rateLimitMiddleware } from '../middlewares/rate-limit.middleware'
import { RATE_LIMITS } from '../lib/rate-limit-config'

export const giftPaymentController = new Hono<AppEnv>()

const giftPaymentCreateRateLimit = rateLimitMiddleware(RATE_LIMITS.GIFT_PAYMENT_CREATE)
const giftPaymentConfirmRateLimit = rateLimitMiddleware(RATE_LIMITS.GIFT_PAYMENT_CONFIRM)
const giftPaymentCancelRateLimit = rateLimitMiddleware(RATE_LIMITS.GIFT_PAYMENT_CANCEL)

giftPaymentController.get(
  '/',
  describeRoute({
    summary: 'List gift payments',
    description: 'Returns all gift payment claims for the wedding, including the gift each one is for.',
    tags: ['Gift Payments'],
    responses: mapResponses({
      schema: GiftPaymentResponseSchema.COLLECTION,
      successMessage: 'Gift payments listed successfully',
    }),
  }),
  validator('param', WeddingIdParamSchema, zodErrorHook),
  async (c) => {
    const { weddingId } = c.req.valid('param')
    const actor = c.get('actor')
    const accessService = createWeddingAccessService(c)
    accessService.assertCanAccessWedding(actor, weddingId)

    const service = createGiftPaymentService(c)
    const data = await service.listForWedding(weddingId)
    return c.json({ data })
  },
)

giftPaymentController.post(
  '/',
  giftPaymentCreateRateLimit,
  describeRoute({
    summary: 'Create gift payment',
    description: 'Logs a PIX payment claim for a gift. Starts with status PENDING. 404 if the gift does not exist in this wedding.',
    tags: ['Gift Payments'],
    responses: mapResponses({
      schema: GiftPaymentResponseSchema.SINGLE,
      successMessage: 'Gift payment created successfully',
      status: 201,
    }),
  }),
  validator('param', WeddingIdParamSchema, zodErrorHook),
  validator('json', GiftPaymentRequestSchema.CREATE, zodErrorHook),
  async (c) => {
    const { weddingId } = c.req.valid('param')
    const actor = c.get('actor')
    const accessService = createWeddingAccessService(c)
    accessService.assertCanAccessWedding(actor, weddingId)

    const body = c.req.valid('json')
    const service = createGiftPaymentService(c)
    const data = await service.create(weddingId, body)
    return c.json({ data }, 201)
  },
)

giftPaymentController.patch(
  '/:id/confirm',
  giftPaymentConfirmRateLimit,
  describeRoute({
    summary: 'Confirm gift payment',
    description: 'Marks a gift payment claim as CONFIRMED, once the PIX has been manually verified as received. 409 if the payment is not PENDING.',
    tags: ['Gift Payments'],
    responses: mapResponses({
      schema: GiftPaymentResponseSchema.SINGLE,
      successMessage: 'Gift payment confirmed successfully',
    }),
  }),
  validator('param', GiftPaymentRequestSchema.ID_PARAM, zodErrorHook),
  async (c) => {
    const { weddingId, id } = c.req.valid('param')
    const actor = c.get('actor')
    const accessService = createWeddingAccessService(c)
    accessService.assertCanAccessWedding(actor, weddingId)

    const service = createGiftPaymentService(c)
    const data = await service.confirm(weddingId, id)
    return c.json({ data })
  },
)

giftPaymentController.patch(
  '/:id/cancel',
  giftPaymentCancelRateLimit,
  describeRoute({
    summary: 'Cancel gift payment',
    description: 'Marks a PENDING gift payment claim as CANCELLED, e.g. when the PIX never arrived or the claim was wrong. 409 if the payment is not PENDING.',
    tags: ['Gift Payments'],
    responses: mapResponses({
      schema: GiftPaymentResponseSchema.SINGLE,
      successMessage: 'Gift payment cancelled successfully',
    }),
  }),
  validator('param', GiftPaymentRequestSchema.ID_PARAM, zodErrorHook),
  async (c) => {
    const { weddingId, id } = c.req.valid('param')
    const actor = c.get('actor')
    const accessService = createWeddingAccessService(c)
    accessService.assertCanAccessWedding(actor, weddingId)

    const service = createGiftPaymentService(c)
    const data = await service.cancel(weddingId, id)
    return c.json({ data })
  },
)
