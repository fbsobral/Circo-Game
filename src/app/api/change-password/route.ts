import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isValidPassword } from "@/lib/security"

// Only for the forced change after a temporary password. Regular changes go through /api/conta/password,
// which asks for the current password.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { mustChangePassword: true } })
  if (!user?.mustChangePassword) {
    return NextResponse.json({ error: "Use a página da conta para trocar a senha" }, { status: 403 })
  }

  const { password } = await req.json().catch(() => ({}))
  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "A senha deve ter entre 8 e 128 caracteres" }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 12)
  await db.user.update({
    where: { id: session.user.id },
    data: { password: hash, mustChangePassword: false },
  })

  return NextResponse.json({ ok: true })
}
