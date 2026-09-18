import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { password } = await req.json()
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "A senha deve ter no mínimo 8 caracteres" }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 12)
  await db.user.update({
    where: { id: session.user.id },
    data: { password: hash, mustChangePassword: false },
  })

  return NextResponse.json({ ok: true })
}
