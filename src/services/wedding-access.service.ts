import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import { AbstractService } from '../core/abstract-service'
import type { AppEnv, Actor } from '../types/hono-env'

export class WeddingAccessService extends AbstractService {
  assertCanAccessWedding(actor: Actor, weddingId: number): void {
    if (actor.kind === 'user') {
      if (actor.role === 'SUPER_ADMIN' || actor.managedWeddingIds.includes(weddingId)) {
        return
      }
    } else if (actor.weddingId === weddingId) {
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
