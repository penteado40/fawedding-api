import type { Gift as GiftRow } from '@prisma/client'
import type { z } from 'zod'
import { GiftModelSchema, GiftRequestSchema } from '../schemas/gift.schema'

export type GiftModelResponse = z.infer<typeof GiftModelSchema>
export type CreateGiftRequest = z.infer<typeof GiftRequestSchema.CREATE>
export type CreateGiftFormRequest = z.infer<typeof GiftRequestSchema.CREATE_FORM>
export type UpdateGiftRequest = z.infer<typeof GiftRequestSchema.UPDATE>
export type UpdateGiftFormRequest = z.infer<typeof GiftRequestSchema.UPDATE_FORM>
export type SearchGiftRequest = z.infer<typeof GiftRequestSchema.SEARCH>

export function toGiftResponse(gift: GiftRow): GiftModelResponse {
  return {
    id: gift.id,
    name: gift.name,
    image: gift.image,
    amazonLink: gift.amazonLink,
    price: Number(gift.price),
    createdAt: gift.createdAt.toISOString(),
    updatedAt: gift.updatedAt.toISOString(),
  }
}
