import type { ApiToken as ApiTokenRow } from '@prisma/client'
import type { z } from 'zod'
import {
  ApiTokenModelSchema,
  ApiTokenMetaModelSchema,
  ApiTokenRequestSchema,
} from '../schemas/api-token.schema'

export type ApiTokenModel = z.infer<typeof ApiTokenModelSchema>
export type ApiTokenMeta = z.infer<typeof ApiTokenMetaModelSchema>
export type CreateApiTokenRequest = z.infer<typeof ApiTokenRequestSchema.CREATE>
export type UpdateApiTokenRequest = z.infer<typeof ApiTokenRequestSchema.UPDATE>
export type GetApiTokenRequest = z.infer<typeof ApiTokenRequestSchema.GET>
export type SearchApiTokenRequest = z.infer<typeof ApiTokenRequestSchema.SEARCH>

export function toApiTokenResponse(row: ApiTokenRow): ApiTokenModel {
  return {
    id: row.id,
    name: row.name,
    token: row.token,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function toApiTokenMeta(row: ApiTokenRow): ApiTokenMeta {
  return {
    id: row.id,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
