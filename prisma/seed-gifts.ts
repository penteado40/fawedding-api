import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Prisma, PrismaClient } from '@prisma/client'

type GiftSeed = { weddingId: number; name: string; description?: string; price: number }

async function main() {
  const gifts: GiftSeed[] = JSON.parse(readFileSync(join(__dirname, 'gifts.json'), 'utf-8'))

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  })

  let created = 0
  let skipped = 0
  for (const gift of gifts) {
    const exists = await prisma.gift.findFirst({ where: { weddingId: gift.weddingId, name: gift.name } })
    if (exists) {
      console.log('Já existe, pulando:', gift.name)
      skipped++
      continue
    }
    await prisma.gift.create({
      data: {
        weddingId: gift.weddingId,
        name: gift.name,
        description: gift.description ?? null,
        price: new Prisma.Decimal(gift.price),
      },
    })
    created++
  }

  console.log(`Presentes criados: ${created}, pulados: ${skipped}`)
  await prisma.$disconnect()
}

main()
