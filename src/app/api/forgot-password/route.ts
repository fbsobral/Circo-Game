import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 })

  const user = await db.user.findUnique({ where: { email } })
  // always return ok to avoid email enumeration
  if (!user) return NextResponse.json({ ok: true })

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  const reset = await db.passwordReset.create({
    data: { userId: user.id, expiresAt },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${reset.token}`
  await sendPasswordResetEmail(user.email!, user.name ?? "Aluno", resetUrl)

  return NextResponse.json({ ok: true })
}
