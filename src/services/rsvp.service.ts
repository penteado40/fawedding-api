import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import { AbstractService } from '../core/abstract-service'
import { isDuplicateKeyError } from '../lib/prisma'
import { publishRsvpConfirmation } from '../lib/sqs'
import type { AppEnv } from '../types/hono-env'
import type { CreateRsvpRequest, RsvpModelResponse, SearchRsvpRequest } from '../models/rsvp.model'
import { toRsvpResponse } from '../models/rsvp.model'

export class RsvpService extends AbstractService {
  async list(weddingId: number, search: SearchRsvpRequest = {}): Promise<RsvpModelResponse[]> {
    const rsvps = await this.prisma.rsvp.findMany({
      where: { weddingId, ...(search.status ? { status: search.status } : {}) },
      orderBy: { name: 'asc' },
    })
    return rsvps.map(toRsvpResponse)
  }

  async create(weddingId: number, data: CreateRsvpRequest): Promise<RsvpModelResponse> {
    try {
      const rsvp = await this.prisma.rsvp.create({
        data: {
          weddingId,
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
      })
      void publishRsvpConfirmation({ name: rsvp.name, email: rsvp.email })
      return toRsvpResponse(rsvp)
    } catch (err) {
      if (isDuplicateKeyError(err, 'email')) {
        throw new HTTPException(409, { message: 'Email already registered' })
      }
      throw err
    }
  }
}

export function createRsvpService(c: Context<AppEnv>): RsvpService {
  return new RsvpService(c.get('prisma'))
}
