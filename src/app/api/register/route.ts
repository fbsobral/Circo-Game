import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)
  await db.user.create({ data: { name, email, password: hash } })

  const loginUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/login`
  sendWelcomeEmail(email, name, loginUrl).catch(() => {})

  return NextResponse.json({ ok: true })
}
