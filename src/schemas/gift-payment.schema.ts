import { z } from 'zod'
import { GiftModelSchema } from './gift.schema'

export const GiftPaymentStatusSchema = z.enum(['PENDING', 'CONFIRMED'])

export const GiftPaymentModelSchema = z.object({
  id: z.number().int(),
  giftId: z.number().int(),
  name: z.string(),
  phone: z.string(),
  value: z.number().positive(),
  status: GiftPaymentStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const GiftPaymentWithGiftModelSchema = GiftPaymentModelSchema.extend({
  gift: GiftModelSchema,
})

export const GiftPaymentRequestSchema = {
  CREATE: z.object({
    giftId: z.number().int().positive(),
    name: z.string().min(1).max(200),
    phone: z.string().min(1).max(20),
    value: z.number().positive(),
  }),
  ID_PARAM: z.object({
    weddingId: z.coerce.number().int().positive(),
    id: z.coerce.number().int().positive(),
  }),
}

export const GiftPaymentResponseSchema = {
  SINGLE: z.object({
    data: GiftPaymentModelSchema,
  }),
  COLLECTION: z.object({
    data: z.array(GiftPaymentWithGiftModelSchema),
  }),
}
