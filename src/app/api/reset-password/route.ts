import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })

  const reset = await db.passwordReset.findUnique({ where: { token } })
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 12)
  await db.user.update({ where: { id: reset.userId }, data: { password: hash } })
  await db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } })

  return NextResponse.json({ ok: true })
}
