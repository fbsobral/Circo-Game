import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { password: true } })
  if (!user?.password) return NextResponse.json({ error: "Defina uma senha antes de desvincular o Google" }, { status: 400 })

  await db.account.deleteMany({ where: { userId: session.user.id, provider: "google" } })
  return NextResponse.json({ ok: true })
}
