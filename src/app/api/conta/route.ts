import { NextResponse } from "next/server"
import { auth, signOut } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  await db.user.delete({ where: { id: session.user.id } })
  return NextResponse.json({ ok: true })
}
