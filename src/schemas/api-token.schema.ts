import { z } from 'zod'

const ApiTokenBaseModelSchema = z.object({
  id: z.number().int(),
  weddingId: z.number().int(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const ApiTokenModelSchema = ApiTokenBaseModelSchema.extend({
  token: z.string(),
})

export const ApiTokenMetaModelSchema = ApiTokenBaseModelSchema

export const ApiTokenRequestSchema = {
  CREATE: z.object({
    name: z.string().min(1).max(200),
    weddingId: z.number().int().positive(),
  }),
  UPDATE: z.object({
    name: z.string().min(1).max(200).optional(),
    isActive: z.boolean().optional(),
  }),
  GET: z.object({
    id: z.coerce.number().int().positive(),
  }),
  DELETE: z.object({
    id: z.coerce.number().int().positive(),
  }),
  SEARCH: ApiTokenBaseModelSchema.omit({ createdAt: true, updatedAt: true }).partial(),
}

export const ApiTokenResponseSchema = {
  SINGLE_WITH_TOKEN: z.object({
    data: ApiTokenModelSchema,
  }),
  SINGLE: z.object({
    data: ApiTokenMetaModelSchema,
  }),
  COLLECTION: z.object({
    data: z.array(ApiTokenModelSchema),
  }),
}
