import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

const email = process.argv[2]
const password = process.argv[3] ?? "Circo@2024"
const name = process.argv[4] ?? "Admin"

if (!email) {
  console.error("Uso: node scripts/create-admin.mjs <email> [senha] [nome]")
  process.exit(1)
}

const hash = await bcrypt.hash(password, 12)

const user = await db.user.upsert({
  where: { email },
  update: { role: "admin", password: hash, name },
  create: { email, name, password: hash, role: "admin" },
})

console.log(`✓ Admin criado: ${user.email} (id: ${user.id})`)
await db.$disconnect()
