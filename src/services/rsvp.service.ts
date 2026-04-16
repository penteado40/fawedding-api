import { Prisma } from '@prisma/client'
import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import { AbstractService } from '../core/abstract-service'
import type { AppEnv } from '../types/hono-env'
import type { CreateRsvpRequest, RsvpModelResponse, SearchRsvpRequest } from '../models/rsvp.model'
import { toRsvpResponse } from '../models/rsvp.model'

export class RsvpService extends AbstractService {
  async list(search: SearchRsvpRequest = {}): Promise<RsvpModelResponse[]> {
    const rsvps = await this.prisma.rsvp.findMany({
      where: search.status ? { status: search.status } : {},
      orderBy: { createdAt: 'desc' },
    })
    return rsvps.map(toRsvpResponse)
  }

  async create(data: CreateRsvpRequest): Promise<RsvpModelResponse> {
    try {
      const rsvp = await this.prisma.rsvp.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
      })
      return toRsvpResponse(rsvp)
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new HTTPException(409, { message: 'Email already registered' })
      }
      throw err
    }
  }
}

export function createRsvpService(c: Context<AppEnv>): RsvpService {
  return new RsvpService(c.get('prisma'))
}
