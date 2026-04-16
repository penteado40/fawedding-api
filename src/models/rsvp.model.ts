import type { Rsvp as RsvpRow } from '@prisma/client'
import type { z } from 'zod'
import { RsvpModelSchema, RsvpRequestSchema } from '../schemas/rsvp.schema'

export type RsvpModelResponse = z.infer<typeof RsvpModelSchema>
export type CreateRsvpRequest = z.infer<typeof RsvpRequestSchema.CREATE>
export type SearchRsvpRequest = z.infer<typeof RsvpRequestSchema.SEARCH>

export function toRsvpResponse(rsvp: RsvpRow): RsvpModelResponse {
  return {
    id: rsvp.id,
    name: rsvp.name,
    email: rsvp.email,
    phone: rsvp.phone,
    status: rsvp.status,
    createdAt: rsvp.createdAt.toISOString(),
    updatedAt: rsvp.updatedAt.toISOString(),
  }
}
