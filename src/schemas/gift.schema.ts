import { z } from 'zod'

export const GiftModelSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  image: z.string().nullable(),
  amazonLink: z.string().url().nullable(),
  price: z.number().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const GiftRequestSchema = {
  CREATE: z.object({
    name: z.string().min(1).max(200),
    image: z.string().optional().nullable(),
    amazonLink: z.string().url().optional().nullable(),
    price: z.number().positive(),
  }),
  CREATE_FORM: z.object({
    name: z.string().min(1).max(200),
    price: z.coerce.number().positive(),
    amazonLink: z.string().url().optional().nullable(),
    image: z.any().optional().meta({ type: 'string', format: 'binary' }),
  }),
  UPDATE: z.object({
    name: z.string().min(1).max(200).optional(),
    image: z.string().optional().nullable(),
    amazonLink: z.string().url().optional().nullable(),
    price: z.number().positive().optional(),
  }),
  UPDATE_FORM: z.object({
    name: z.string().min(1).max(200).optional(),
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
    })
    .partial(),
}

export const GiftResponseSchema = {
  SINGLE: z.object({
    data: GiftModelSchema,
  }),
  COLLECTION: z.object({
    data: z.array(GiftModelSchema),
  }),
}
