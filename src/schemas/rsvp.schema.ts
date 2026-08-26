import { z } from 'zod'

export const RsvpStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'DECLINED'])
export const EmailStatusSchema = z.enum(['PENDING', 'SENT', 'FAILED'])

export const RsvpModelSchema = z.object({
  id: z.number().int(),
  weddingId: z.number().int(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  status: RsvpStatusSchema,
  emailStatus: EmailStatusSchema,
  emailSentAt: z.string().nullable(),
  emailError: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const RsvpRequestSchema = {
  CREATE: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    phone: z.string().min(1).max(20),
  }),
  SEARCH: z
    .object({
      status: RsvpStatusSchema.optional(),
    })
    .partial(),
  ID_PARAM: z.object({
    weddingId: z.coerce.number().int().positive(),
    id: z.coerce.number().int().positive(),
  }),
}

export const RsvpResponseSchema = {
  SINGLE: z.object({
    data: RsvpModelSchema,
  }),
  COLLECTION: z.object({
    data: z.array(RsvpModelSchema),
  }),
}
