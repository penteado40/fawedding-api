import type { Wedding as WeddingRow, WeddingManager as WeddingManagerRow, User } from '@prisma/client'
import type { z } from 'zod'
import {
  WeddingManagerModelSchema,
  WeddingModelSchema,
  WeddingManagerRequestSchema,
  WeddingRequestSchema,
} from '../schemas/wedding.schema'

export type WeddingModel = z.infer<typeof WeddingModelSchema>
export type WeddingManagerModel = z.infer<typeof WeddingManagerModelSchema>
export type CreateWeddingRequest = z.infer<typeof WeddingRequestSchema.CREATE>
export type AssignWeddingManagerRequest = z.infer<typeof WeddingManagerRequestSchema.ASSIGN_BODY>

export type WeddingRowWithManagers = WeddingRow & {
  managers: (WeddingManagerRow & { user: Pick<User, 'id' | 'name' | 'email'> })[]
}

export function toWeddingResponse(row: WeddingRowWithManagers): WeddingModel {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    siteUrl: row.siteUrl,
    date: row.date.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    managers: row.managers.map((manager) => ({
      id: manager.id,
      userId: manager.userId,
      name: manager.user.name,
      email: manager.user.email,
      createdAt: manager.createdAt.toISOString(),
    })),
  }
}

export function toWeddingManagerResponse(row: WeddingManagerRow): WeddingManagerModel {
  return {
    id: row.id,
    weddingId: row.weddingId,
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
  }
}
