import { Prisma } from '@prisma/client'
import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import { AbstractService } from '../core/abstract-service'
import type { AppEnv } from '../types/hono-env'
import type {
  CreateGiftRequest,
  GiftModelResponse,
  SearchGiftRequest,
  UpdateGiftRequest,
} from '../models/gift.model'
import { toGiftResponse } from '../models/gift.model'

export class GiftService extends AbstractService {
  async list(search: SearchGiftRequest = {}): Promise<GiftModelResponse[]> {
    const gifts = await this.prisma.gift.findMany({
      where: search.name
        ? { name: { contains: search.name, mode: 'insensitive' } }
        : {},
      orderBy: { createdAt: 'desc' },
    })
    return gifts.map(toGiftResponse)
  }

  async create(data: CreateGiftRequest): Promise<GiftModelResponse> {
    const gift = await this.prisma.gift.create({
      data: {
        name: data.name,
        image: data.image ?? null,
        amazonLink: data.amazonLink ?? null,
        price: new Prisma.Decimal(data.price),
      },
    })
    return toGiftResponse(gift)
  }

  async update(id: number, data: UpdateGiftRequest): Promise<GiftModelResponse> {
    const existing = await this.prisma.gift.findUnique({ where: { id } })
    if (!existing) {
      throw new HTTPException(404, { message: 'Gift not found' })
    }
    const patch = buildUpdateInput(data)
    const gift = await this.prisma.gift.update({
      where: { id },
      data: patch,
    })
    return toGiftResponse(gift)
  }

  async delete(id: number): Promise<GiftModelResponse> {
    const existing = await this.prisma.gift.findUnique({ where: { id } })
    if (!existing) {
      throw new HTTPException(404, { message: 'Gift not found' })
    }
    const gift = await this.prisma.gift.delete({ where: { id } })
    return toGiftResponse(gift)
  }

  async getById(id: number): Promise<GiftModelResponse> {
    const gift = await this.prisma.gift.findUnique({ where: { id } })
    if (!gift) {
      throw new HTTPException(404, { message: 'Gift not found' })
    }
    return toGiftResponse(gift)
  }
}

function buildUpdateInput(data: UpdateGiftRequest): Prisma.GiftUpdateInput {
  const out: Prisma.GiftUpdateInput = {}
  if (data.name !== undefined) out.name = data.name
  if (data.image !== undefined) out.image = { set: data.image ?? null }
  if (data.amazonLink !== undefined) out.amazonLink = { set: data.amazonLink ?? null }
  if (data.price !== undefined) out.price = new Prisma.Decimal(data.price)
  return out
}

export function createGiftService(c: Context<AppEnv>): GiftService {
  return new GiftService(c.get('prisma'))
}
