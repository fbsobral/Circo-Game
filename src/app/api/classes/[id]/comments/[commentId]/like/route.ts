import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { commentId } = await params
  const userId = session.user.id

  const existing = await db.classCommentLike.findUnique({ where: { commentId_userId: { commentId, userId } } })
  if (existing) {
    await db.classCommentLike.delete({ where: { commentId_userId: { commentId, userId } } })
  } else {
    await db.classCommentLike.create({ data: { commentId, userId } })
  }
  return NextResponse.json({ ok: true })
}
