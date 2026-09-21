import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { uploadGiftImageFromUrl } from '../src/lib/cloudinary'

type GiftSeed = { weddingId: number; name: string; imageUrl?: string }

async function main() {
  const gifts: GiftSeed[] = JSON.parse(readFileSync(join(__dirname, 'gifts.json'), 'utf-8'))

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  })

  let uploaded = 0
  const skipped: string[] = []
  const failed: string[] = []

  for (const seed of gifts) {
    if (!seed.imageUrl) {
      skipped.push(`${seed.name} (sem imageUrl)`)
      continue
    }
    const gift = await prisma.gift.findFirst({ where: { weddingId: seed.weddingId, name: seed.name } })
    if (!gift) {
      failed.push(`${seed.name} (presente não encontrado no banco)`)
      continue
    }
    if (gift.image) {
      skipped.push(`${seed.name} (já tem imagem)`)
      continue
    }

    try {
      const image = await uploadGiftImageFromUrl(seed.weddingId, seed.imageUrl)
      await prisma.gift.update({ where: { id: gift.id }, data: { image: image.url, imagePublicId: image.publicId } })
      console.log('OK:', seed.name)
      uploaded++
    } catch (error) {
      failed.push(`${seed.name} (${error instanceof Error ? error.message : String(error)})`)
    }
  }

  console.log(`\nImagens enviadas: ${uploaded}`)
  if (skipped.length) console.log('Puladas:\n - ' + skipped.join('\n - '))
  if (failed.length) console.log('Falharam:\n - ' + failed.join('\n - '))
  await prisma.$disconnect()
}

main()
