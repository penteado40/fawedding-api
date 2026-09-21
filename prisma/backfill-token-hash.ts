import { PrismaClient } from '@prisma/client'
import { createHash } from 'node:crypto'

// One-time backfill for the tokenHash column added in migration
// 20260917000000_add_api_token_hash. Run once (`npm run backfill:token-hash`) after
// deploying that migration and before the auth middleware's tokenHash-based lookup
// goes live, so tokens issued before this change keep working. See issue #9.
async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  })

  const tokens = await prisma.apiToken.findMany({ where: { tokenHash: null } })
  for (const apiToken of tokens) {
    const tokenHash = createHash('sha256').update(apiToken.token).digest('hex')
    await prisma.apiToken.update({ where: { id: apiToken.id }, data: { tokenHash } })
  }

  console.log(`Backfilled tokenHash for ${tokens.length} token(s).`)
  await prisma.$disconnect()
}

main()
