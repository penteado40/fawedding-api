import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import type { Rsvp, Wedding } from '@prisma/client'
import { AbstractService } from '../core/abstract-service'
import { isDuplicateKeyError } from '../lib/prisma'
import { sendConfirmationEmail, renderConfirmationEmailPreview } from '../lib/email'
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
        include: { wedding: true },
      })
      void this.sendAndTrackConfirmationEmail(rsvp, rsvp.wedding)
      return toRsvpResponse(rsvp)
    } catch (err) {
      if (isDuplicateKeyError(err, 'email')) {
        throw new HTTPException(409, { message: 'Email already registered' })
      }
      throw err
    }
  }

  async resendEmail(weddingId: number, rsvpId: number): Promise<RsvpModelResponse> {
    const rsvp = await this.prisma.rsvp.findFirst({
      where: { id: rsvpId, weddingId },
      include: { wedding: true },
    })
    if (!rsvp) {
      throw new HTTPException(404, { message: 'RSVP not found' })
    }
    const updated = await this.sendAndTrackConfirmationEmail(rsvp, rsvp.wedding)
    return toRsvpResponse(updated)
  }

  async previewEmail(weddingId: number): Promise<string> {
    const wedding = await this.prisma.wedding.findUnique({ where: { id: weddingId } })
    if (!wedding) {
      throw new HTTPException(404, { message: 'Wedding not found' })
    }
    return renderConfirmationEmailPreview('Convidado de Teste', wedding)
  }

  private async sendAndTrackConfirmationEmail(rsvp: Rsvp, wedding: Wedding): Promise<Rsvp> {
    const result = await sendConfirmationEmail(rsvp, wedding)
    return this.prisma.rsvp.update({
      where: { id: rsvp.id },
      data: result.ok
        ? { emailStatus: 'SENT', emailSentAt: new Date(), emailError: null }
        : { emailStatus: 'FAILED', emailError: result.error },
    })
  }
}

export function createRsvpService(c: Context<AppEnv>): RsvpService {
  return new RsvpService(c.get('prisma'))
}
