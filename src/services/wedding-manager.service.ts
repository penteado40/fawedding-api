import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import { AbstractService } from '../core/abstract-service'
import { isDuplicateKeyError } from '../lib/prisma'
import type { AppEnv } from '../types/hono-env'
import type { WeddingManagerModel } from '../models/wedding.model'
import { toWeddingManagerResponse } from '../models/wedding.model'

export class WeddingManagerService extends AbstractService {
  async assign(weddingId: number, userId: number): Promise<WeddingManagerModel> {
    const wedding = await this.prisma.wedding.findUnique({ where: { id: weddingId } })
    if (!wedding) {
      throw new HTTPException(404, { message: 'Wedding not found' })
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new HTTPException(404, { message: 'User not found' })
    }

    try {
      const manager = await this.prisma.weddingManager.create({
        data: { weddingId, userId },
      })
      return toWeddingManagerResponse(manager)
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new HTTPException(409, { message: 'User already manages this wedding' })
      }
      throw err
    }
  }

  async remove(weddingId: number, userId: number): Promise<WeddingManagerModel> {
    const manager = await this.prisma.weddingManager.findUnique({
      where: { weddingId_userId: { weddingId, userId } },
    })
    if (!manager) {
      throw new HTTPException(404, { message: 'Wedding manager link not found' })
    }
    const deleted = await this.prisma.weddingManager.delete({ where: { id: manager.id } })
    return toWeddingManagerResponse(deleted)
  }
}

export function createWeddingManagerService(c: Context<AppEnv>): WeddingManagerService {
  return new WeddingManagerService(c.get('prisma'))
}
