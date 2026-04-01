import type { PrismaClient } from '@prisma/client'

export type ApplicationVariables = {
  prisma: PrismaClient
}

export type AppEnv = {
  Variables: ApplicationVariables
}
