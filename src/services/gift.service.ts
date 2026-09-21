import { Prisma } from '@prisma/client'
import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import { AbstractService } from '../core/abstract-service'
import type { Actor, AppEnv } from '../types/hono-env'
import type {
  CreateGiftRequest,
  GiftModelResponse,
  SearchGiftRequest,
  UpdateGiftRequest,
} from '../models/gift.model'
import { toGiftResponse } from '../models/gift.model'
import { deleteGiftImage, uploadGiftImage, uploadGiftImageFromUrl } from '../lib/cloudinary'
import type { UploadedImage } from '../lib/cloudinary'
import { WeddingAccessService } from './wedding-access.service'

export type GiftImageInput =
  | { kind: 'file'; buffer: Buffer; filename: string }
  | { kind: 'url'; url: string }

async function uploadImage(weddingId: number, input: GiftImageInput): Promise<UploadedImage> {
  if (input.kind === 'file') {
    return uploadGiftImage(weddingId, input.buffer, input.filename)
  }
  try {
    return await uploadGiftImageFromUrl(weddingId, input.url)
  } catch (error) {
    const reason = error instanceof Error ? error.message : (error as { message?: string })?.message
    throw new HTTPException(422, {
      message: `Could not upload image from imageUrl${reason ? `: ${reason}` : ''}`,
    })
  }
}

export type CreateGiftInput = Omit<CreateGiftRequest, 'image'>
export type UpdateGiftInput = Omit<UpdateGiftRequest, 'image'>

export class GiftService extends AbstractService {
  async list(search: SearchGiftRequest = {}, restrictToWeddingIds?: number[]): Promise<GiftModelResponse[]> {
    const gifts = await this.prisma.gift.findMany({
      where: {
        ...(search.name ? { name: { contains: search.name, mode: 'insensitive' } } : {}),
        ...(search.weddingId ? { weddingId: search.weddingId } : {}),
        ...(restrictToWeddingIds ? { weddingId: { in: restrictToWeddingIds } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })
    return gifts.map(toGiftResponse)
  }

  async listForWedding(weddingId: number): Promise<GiftModelResponse[]> {
    const gifts = await this.prisma.gift.findMany({
      where: { weddingId },
      orderBy: { createdAt: 'desc' },
    })
    return gifts.map(toGiftResponse)
  }

  async getByIdForWedding(weddingId: number, id: number): Promise<GiftModelResponse> {
    const gift = await this.prisma.gift.findFirst({ where: { id, weddingId } })
    if (!gift) {
      throw new HTTPException(404, { message: 'Gift not found' })
    }
    return toGiftResponse(gift)
  }

  async create(data: CreateGiftInput, imageFile?: GiftImageInput): Promise<GiftModelResponse> {
    let image: string | null = null
    let imagePublicId: string | null = null

    if (imageFile) {
      const uploaded = await uploadImage(data.weddingId, imageFile)
      image = uploaded.url
      imagePublicId = uploaded.publicId
    }

    const gift = await this.prisma.gift.create({
      data: {
        weddingId: data.weddingId,
        name: data.name,
        description: data.description ?? null,
        image,
        imagePublicId,
        price: new Prisma.Decimal(data.price),
      },
    })
    return toGiftResponse(gift)
  }

  async update(
    actor: Actor,
    id: number,
    data: UpdateGiftInput,
    imageFile?: GiftImageInput,
  ): Promise<GiftModelResponse> {
    const existing = await this.prisma.gift.findUnique({ where: { id } })
    if (!existing || !this.accessService.canAccessWedding(actor, existing.weddingId)) {
      throw new HTTPException(404, { message: 'Gift not found' })
    }

    const patch = buildUpdateInput(data)

    let uploaded: { url: string; publicId: string } | null = null
    if (imageFile) {
      uploaded = await uploadImage(existing.weddingId, imageFile)
      patch.image = { set: uploaded.url }
      patch.imagePublicId = { set: uploaded.publicId }
    }

    const gift = await this.prisma.gift.update({
      where: { id },
      data: patch,
    })

    if (uploaded && existing.imagePublicId) {
      await deleteGiftImage(existing.imagePublicId)
    }

    return toGiftResponse(gift)
  }

  async delete(actor: Actor, id: number): Promise<GiftModelResponse> {
    const existing = await this.prisma.gift.findUnique({ where: { id } })
    if (!existing || !this.accessService.canAccessWedding(actor, existing.weddingId)) {
      throw new HTTPException(404, { message: 'Gift not found' })
    }
    const gift = await this.prisma.gift.delete({ where: { id } })

    if (existing.imagePublicId) {
      await deleteGiftImage(existing.imagePublicId)
    }

    return toGiftResponse(gift)
  }

  async getById(actor: Actor, id: number): Promise<GiftModelResponse> {
    const gift = await this.prisma.gift.findUnique({ where: { id } })
    if (!gift || !this.accessService.canAccessWedding(actor, gift.weddingId)) {
      throw new HTTPException(404, { message: 'Gift not found' })
    }
    return toGiftResponse(gift)
  }

  private get accessService(): WeddingAccessService {
    return new WeddingAccessService(this.prisma)
  }
}

function buildUpdateInput(data: UpdateGiftInput): Prisma.GiftUpdateInput {
  const out: Prisma.GiftUpdateInput = {}
  if (data.name !== undefined) out.name = data.name
  if (data.description !== undefined) out.description = { set: data.description ?? null }
  if (data.price !== undefined) out.price = new Prisma.Decimal(data.price)
  return out
}

export function createGiftService(c: Context<AppEnv>): GiftService {
  return new GiftService(c.get('prisma'))
}
