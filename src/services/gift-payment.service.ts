import { Prisma } from '@prisma/client'
import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import { AbstractService } from '../core/abstract-service'
import type { AppEnv } from '../types/hono-env'
import type {
  CreateGiftPaymentRequest,
  GiftPaymentModelResponse,
  GiftPaymentWithGiftModelResponse,
} from '../models/gift-payment.model'
import { toGiftPaymentResponse, toGiftPaymentWithGiftResponse } from '../models/gift-payment.model'

export class GiftPaymentService extends AbstractService {
  async create(weddingId: number, data: CreateGiftPaymentRequest): Promise<GiftPaymentModelResponse> {
    const gift = await this.prisma.gift.findFirst({ where: { id: data.giftId, weddingId } })
    if (!gift) {
      throw new HTTPException(404, { message: 'Gift not found' })
    }

    const payment = await this.prisma.giftPayment.create({
      data: {
        giftId: data.giftId,
        name: data.name,
        phone: data.phone,
        value: new Prisma.Decimal(data.value),
      },
    })
    return toGiftPaymentResponse(payment)
  }

  async listForWedding(weddingId: number): Promise<GiftPaymentWithGiftModelResponse[]> {
    const payments = await this.prisma.giftPayment.findMany({
      where: { gift: { weddingId } },
      include: { gift: true },
      orderBy: { createdAt: 'desc' },
    })
    return payments.map(toGiftPaymentWithGiftResponse)
  }

  async confirm(weddingId: number, id: number): Promise<GiftPaymentModelResponse> {
    const payment = await this.prisma.giftPayment.findFirst({
      where: { id, gift: { weddingId } },
    })
    if (!payment) {
      throw new HTTPException(404, { message: 'Gift payment not found' })
    }

    const updated = await this.prisma.giftPayment.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    })
    return toGiftPaymentResponse(updated)
  }
}

export function createGiftPaymentService(c: Context<AppEnv>): GiftPaymentService {
  return new GiftPaymentService(c.get('prisma'))
}
