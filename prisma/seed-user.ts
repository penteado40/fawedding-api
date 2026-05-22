import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

async function main() {
  const name = process.env.USER_NAME
  const email = process.env.USER_EMAIL
  const password = process.env.USER_PASSWORD

  if (!name || !email || !password) {
    console.error('Usage: USER_NAME="..." USER_EMAIL="..." USER_PASSWORD="..." npm run seed:user')
    process.exit(1)
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  })

  const hashedPassword = await hash(password, 10)
  const user = await prisma.user.create({ data: { name, email, hashedPassword } })
  console.log(`User created: id=${user.id} email=${user.email}`)
  await prisma.$disconnect()
}

main()
