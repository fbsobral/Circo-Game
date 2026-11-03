import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { isValidPassword } from "@/lib/security"

export async function POST(req: NextRequest) {
  const limit = rateLimit(`reset-ip:${clientIp(req)}`, 15, 60 * 60_000)
  if (!limit.ok) return tooManyRequests(limit.retryAfter)

  const { token, password } = await req.json().catch(() => ({}))
  if (typeof token !== "string" || !token) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "A senha deve ter entre 8 e 128 caracteres" }, { status: 400 })
  }

  const reset = await db.passwordReset.findUnique({ where: { token } })
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 })
  }

  // Claim the token atomically so two simultaneous requests cannot both use it.
  const claimed = await db.passwordReset.updateMany({ where: { id: reset.id, usedAt: null }, data: { usedAt: new Date() } })
  if (claimed.count === 0) return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 })

  const hash = await bcrypt.hash(password, 12)
  await db.user.update({ where: { id: reset.userId }, data: { password: hash, mustChangePassword: false } })
  await db.session.deleteMany({ where: { userId: reset.userId } })

  return NextResponse.json({ ok: true })
}
