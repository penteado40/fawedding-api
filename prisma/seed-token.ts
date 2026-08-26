import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'node:crypto'

async function main() {
  const weddingId = Number(process.env.WEDDING_ID ?? 1)

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  })
  const token = randomUUID()
  await prisma.apiToken.create({ data: { name: 'admin', token, weddingId } })
  console.log('Token criado:', token)
  await prisma.$disconnect()
}

main()
