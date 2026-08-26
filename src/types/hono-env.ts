import type { PrismaClient, UserRole } from '@prisma/client'

export type UserActor = {
  kind: 'user'
  userId: number
  role: UserRole
  managedWeddingIds: number[]
}

export type ApiTokenActor = {
  kind: 'apiToken'
  apiTokenId: number
  weddingId: number
}

export type Actor = UserActor | ApiTokenActor

export type ApplicationVariables = {
  prisma: PrismaClient
  actor: Actor
}

export type AppEnv = {
  Variables: ApplicationVariables
}
