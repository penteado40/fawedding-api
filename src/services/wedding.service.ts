import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import { AbstractService } from '../core/abstract-service'
import { isDuplicateKeyError } from '../lib/prisma'
import type { AppEnv, Actor } from '../types/hono-env'
import type { CreateWeddingRequest, WeddingModel } from '../models/wedding.model'
import { toWeddingResponse } from '../models/wedding.model'

const WITH_MANAGERS = {
  managers: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
} as const

export class WeddingService extends AbstractService {
  async list(actor: Actor): Promise<WeddingModel[]> {
    const isSuperAdmin = actor.kind === 'user' && actor.role === 'SUPER_ADMIN'
    const weddings = await this.prisma.wedding.findMany({
      where: isSuperAdmin
        ? {}
        : { id: { in: actor.kind === 'user' ? actor.managedWeddingIds : [actor.weddingId] } },
      orderBy: { createdAt: 'desc' },
      include: WITH_MANAGERS,
    })
    return weddings.map(toWeddingResponse)
  }

  async create(data: CreateWeddingRequest): Promise<WeddingModel> {
    try {
      const wedding = await this.prisma.wedding.create({
        data: { name: data.name, slug: data.slug, siteUrl: data.siteUrl, date: data.date },
        include: WITH_MANAGERS,
      })
      return toWeddingResponse(wedding)
    } catch (err) {
      if (isDuplicateKeyError(err, 'slug')) {
        throw new HTTPException(409, { message: 'Slug already registered' })
      }
      throw err
    }
  }

  async getById(id: number): Promise<WeddingModel> {
    const wedding = await this.prisma.wedding.findUnique({ where: { id }, include: WITH_MANAGERS })
    if (!wedding) {
      throw new HTTPException(404, { message: 'Wedding not found' })
    }
    return toWeddingResponse(wedding)
  }
}

export function createWeddingService(c: Context<AppEnv>): WeddingService {
  return new WeddingService(c.get('prisma'))
}
