import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { generateToken, normalizeEmail } from "@/lib/security"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = normalizeEmail(body.email)
  if (!email) return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 })

  const ip = clientIp(req)
  const byIp = rateLimit(`forgot-ip:${ip}`, 10, 60 * 60_000)
  const byEmail = rateLimit(`forgot:${email}`, 3, 60 * 60_000)
  if (!byIp.ok || !byEmail.ok) return tooManyRequests(Math.max(byIp.retryAfter, byEmail.retryAfter))

  // always return ok, with the same work done in the request, to avoid email enumeration
  const user = await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })
  if (!user) return NextResponse.json({ ok: true })

  await db.passwordReset.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } })
  const reset = await db.passwordReset.create({
    data: { userId: user.id, token: generateToken(), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${reset.token}`
  sendPasswordResetEmail(user.email, user.name ?? "Aluno", resetUrl).catch(() => {})

  return NextResponse.json({ ok: true })
}
