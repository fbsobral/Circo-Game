import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session || (role !== "professor" && role !== "admin")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { id } = await params
  const cls = await db.class.findUnique({ where: { id }, select: { createdById: true } })
  if (!cls) return NextResponse.json({ error: "Não encontrada" }, { status: 404 })

  if (role !== "admin" && cls.createdById !== session.user.id) {
    return NextResponse.json({ error: "Você não criou esta aula" }, { status: 403 })
  }

  await db.starRecord.deleteMany({ where: { classId: id } })
  await db.class.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
