import { z } from 'zod'
import { BrDateSchema } from './common.schema'

export const WeddingManagerWithUserModelSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
})

export const WeddingModelSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
  siteUrl: z.string(),
  date: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  managers: z.array(WeddingManagerWithUserModelSchema),
})

export const WeddingIdParamSchema = z.object({
  weddingId: z.coerce.number().int().positive(),
})

export const WeddingRequestSchema = {
  CREATE: z.object({
    name: z.string().min(1).max(200),
    slug: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with dashes'),
    siteUrl: z.string().url(),
    date: BrDateSchema,
  }),
  PARAM: z.object({
    id: z.coerce.number().int().positive(),
  }),
  SEARCH: z.object({}).partial(),
}

export const WeddingManagerRequestSchema = {
  ASSIGN_PARAM: z.object({
    id: z.coerce.number().int().positive(),
  }),
  ASSIGN_BODY: z.object({
    userId: z.number().int().positive(),
  }),
  REMOVE_PARAM: z.object({
    id: z.coerce.number().int().positive(),
    userId: z.coerce.number().int().positive(),
  }),
}

export const WeddingManagerModelSchema = z.object({
  id: z.number().int(),
  weddingId: z.number().int(),
  userId: z.number().int(),
  createdAt: z.string(),
})

export const WeddingResponseSchema = {
  SINGLE: z.object({
    data: WeddingModelSchema,
  }),
  COLLECTION: z.object({
    data: z.array(WeddingModelSchema),
  }),
}

export const WeddingManagerResponseSchema = {
  SINGLE: z.object({
    data: WeddingManagerModelSchema,
  }),
}
