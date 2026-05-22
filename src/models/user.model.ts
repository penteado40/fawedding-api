import type { User as UserRow } from '@prisma/client'
import { z } from 'zod'

export const UserModelSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type UserModel = z.infer<typeof UserModelSchema>

export function toUserResponse(user: UserRow): UserModel {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}
