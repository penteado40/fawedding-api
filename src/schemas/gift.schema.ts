import { z } from 'zod'

export const GiftModelSchema = z.object({
  id: z.uuidv4(),
  name: z.string(),
  image: z.string().url(),
  amazonLink: z.string().url(),
  price: z.number().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const GiftRequestSchema = {
  CREATE: z.object({
    name: z.string().min(1).max(200),
    image: z.string().url().optional().nullable(),
    amazonLink: z.string().url().optional().nullable(),
    price: z.number().positive(),
  }),
  UPDATE: z.object({
    name: z.string().min(1).max(200).optional(),
    image: z.string().url().optional().nullable(),
    amazonLink: z.string().url().optional().nullable(),
    price: z.number().positive().optional(),
  }),
  GET: z.object({
    id: z.uuidv4(),
  }),
  DELETE: z.object({
    id: z.uuidv4(),
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
