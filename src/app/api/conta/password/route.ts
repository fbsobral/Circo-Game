import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { isValidPassword } from "@/lib/security"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const limit = rateLimit(`pw-change:${session.user.id}`, 10, 15 * 60_000)
  if (!limit.ok) return tooManyRequests(limit.retryAfter)

  const { current, next } = await req.json().catch(() => ({}))
  if (!isValidPassword(next)) return NextResponse.json({ error: "A senha deve ter entre 8 e 128 caracteres" }, { status: 400 })

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  if (user.password) {
    if (typeof current !== "string" || !current) return NextResponse.json({ error: "Informe a senha atual" }, { status: 400 })
    const valid = await bcrypt.compare(current, user.password)
    if (!valid) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
  }

  const hash = await bcrypt.hash(next, 12)
  await db.user.update({ where: { id: session.user.id }, data: { password: hash } })

  // Sign out every other device; keep the one that made the change.
  const jar = await cookies()
  const currentToken = jar.get("__Secure-authjs.session-token")?.value ?? jar.get("authjs.session-token")?.value
  await db.session.deleteMany({ where: { userId: session.user.id, ...(currentToken ? { sessionToken: { not: currentToken } } : {}) } })

  return NextResponse.json({ ok: true })
}
