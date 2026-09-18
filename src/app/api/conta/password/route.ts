import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { current, next } = await req.json()
  if (!next || next.length < 8) return NextResponse.json({ error: "Senha deve ter pelo menos 8 caracteres" }, { status: 400 })

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  if (user.password) {
    if (!current) return NextResponse.json({ error: "Informe a senha atual" }, { status: 400 })
    const valid = await bcrypt.compare(current, user.password)
    if (!valid) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
  }

  const hash = await bcrypt.hash(next, 12)
  await db.user.update({ where: { id: session.user.id }, data: { password: hash } })
  return NextResponse.json({ ok: true })
}
