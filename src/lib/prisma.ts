import { Prisma, PrismaClient } from '@prisma/client'

export function isDuplicateKeyError(err: unknown, field?: string): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false
  if (err.code !== 'P2002') return false
  if (field === undefined) return true
  const target = err.meta?.target
  return Array.isArray(target) && target.includes(field)
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export function getPrisma(databaseUrl: string): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  })
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }
  return prisma
}
