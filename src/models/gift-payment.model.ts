import type { Gift as GiftRow, GiftPayment as GiftPaymentRow } from '@prisma/client'
import type { z } from 'zod'
import { GiftPaymentModelSchema, GiftPaymentRequestSchema, GiftPaymentWithGiftModelSchema } from '../schemas/gift-payment.schema'
import { toGiftResponse } from './gift.model'

export type GiftPaymentModelResponse = z.infer<typeof GiftPaymentModelSchema>
export type GiftPaymentWithGiftModelResponse = z.infer<typeof GiftPaymentWithGiftModelSchema>
export type CreateGiftPaymentRequest = z.infer<typeof GiftPaymentRequestSchema.CREATE>

export function toGiftPaymentResponse(payment: GiftPaymentRow): GiftPaymentModelResponse {
  return {
    id: payment.id,
    giftId: payment.giftId,
    name: payment.name,
    phone: payment.phone,
    value: Number(payment.value),
    status: payment.status,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  }
}

export function toGiftPaymentWithGiftResponse(
  payment: GiftPaymentRow & { gift: GiftRow },
): GiftPaymentWithGiftModelResponse {
  return {
    ...toGiftPaymentResponse(payment),
    gift: toGiftResponse(payment.gift),
  }
}
