import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { randomUUID } from "crypto"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { normalizeEmail } from "@/lib/security"

// Custom credentials login that bypasses NextAuth's broken credentials+database-session flow.
// Creates the Session record directly, then sets the cookie NextAuth expects.
// Compared against when the e-mail is unknown, so response time does not reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync(randomUUID(), 12)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = normalizeEmail(body.email)
  const password = body.password
  if (!email || typeof password !== "string" || !password || password.length > 128) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 400 })
  }

  const ip = clientIp(req)
  const byIp = rateLimit(`login-ip:${ip}`, 40, 15 * 60_000)
  const byAccount = rateLimit(`login:${ip}:${email}`, 8, 15 * 60_000)
  if (!byIp.ok || !byAccount.ok) return tooManyRequests(Math.max(byIp.retryAfter, byAccount.retryAfter))

  const user = await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })
  const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH)
  if (!user || !user.password || !valid) {
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 })
  }

  const sessionToken = randomUUID()
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await db.session.create({
    data: { sessionToken, userId: user.id, expires },
  })

  const isSecure = process.env.NEXTAUTH_URL?.startsWith("https")
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token"
  const cookieOptions = [
    `${cookieName}=${sessionToken}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Expires=${expires.toUTCString()}`,
    isSecure ? "Secure" : "",
  ].filter(Boolean).join("; ")

  const res = NextResponse.json({ ok: true, mustChangePassword: user.mustChangePassword })
  res.headers.set("Set-Cookie", cookieOptions)
  return res
}
