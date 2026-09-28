import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { randomUUID } from "crypto"

// Custom credentials login that bypasses NextAuth's broken credentials+database-session flow.
// Creates the Session record directly, then sets the cookie NextAuth expects.
export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !user.password) {
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
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
