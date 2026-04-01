import type { PrismaClient } from '@prisma/client'

export abstract class AbstractService {
  constructor(protected readonly prisma: PrismaClient) {}
}
