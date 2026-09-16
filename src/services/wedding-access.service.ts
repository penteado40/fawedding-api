import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import { AbstractService } from '../core/abstract-service'
import type { AppEnv, Actor } from '../types/hono-env'

export class WeddingAccessService extends AbstractService {
  canAccessWedding(actor: Actor, weddingId: number): boolean {
    if (actor.kind === 'user') {
      return actor.role === 'SUPER_ADMIN' || actor.managedWeddingIds.includes(weddingId)
    }
    return actor.weddingId === weddingId
  }

  assertCanAccessWedding(actor: Actor, weddingId: number): void {
    if (this.canAccessWedding(actor, weddingId)) {
      return
    }
    throw new HTTPException(403, { message: 'Forbidden' })
  }

  assertCanManagePlatform(actor: Actor): void {
    if (actor.kind === 'user' && actor.role === 'SUPER_ADMIN') {
      return
    }
    throw new HTTPException(403, { message: 'Forbidden' })
  }
}

export function createWeddingAccessService(c: Context<AppEnv>): WeddingAccessService {
  return new WeddingAccessService(c.get('prisma'))
}
