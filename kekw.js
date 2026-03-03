import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function criar() {
  const senhaHash = await bcrypt.hash("123456", 10)

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: senhaHash
    }
  })

  console.log("Admin garantido no sistema.")
  process.exit()
}

criar()