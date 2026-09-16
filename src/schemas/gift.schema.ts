import { z } from 'zod'

export const GiftModelSchema = z.object({
  id: z.number().int(),
  weddingId: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  amazonLink: z.string().url().nullable(),
  price: z.number().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const GiftRequestSchema = {
  CREATE: z.object({
    weddingId: z.number().int().positive(),
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional().nullable(),
    image: z.string().optional().nullable(),
    amazonLink: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
    price: z.number().positive(),
  }),
  CREATE_FORM: z.object({
    weddingId: z.coerce.number().int().positive(),
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional().nullable(),
    price: z.coerce.number().positive(),
    amazonLink: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
    image: z.any().optional().meta({ type: 'string', format: 'binary' }),
  }),
  UPDATE: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    image: z.string().optional().nullable(),
    amazonLink: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
    price: z.number().positive().optional(),
  }),
  UPDATE_FORM: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    price: z.coerce.number().positive().optional(),
    amazonLink: z.string().url().optional().or(z.literal('')),
    image: z.any().optional().meta({ type: 'string', format: 'binary' }),
  }),
  UPLOADS: z.object({
    filename: z.string().min(1),
  }),
  GET: z.object({
    id: z.coerce.number().int().positive(),
  }),
  DELETE: z.object({
    id: z.coerce.number().int().positive(),
  }),
  SEARCH: z
    .object({
      name: z.string().min(1).max(200).optional(),
      weddingId: z.coerce.number().int().positive().optional(),
    })
    .partial(),
  WEDDING_GET: z.object({
    weddingId: z.coerce.number().int().positive(),
    id: z.coerce.number().int().positive(),
  }),
}

export const GiftResponseSchema = {
  SINGLE: z.object({
    data: GiftModelSchema,
  }),
  COLLECTION: z.object({
    data: z.array(GiftModelSchema),
  }),
}
