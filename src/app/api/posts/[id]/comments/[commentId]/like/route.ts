import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { commentId } = await params
  const userId = session.user.id

  const existing = await db.postCommentLike.findUnique({
    where: { commentId_userId: { commentId, userId } },
  })

  if (existing) {
    await db.postCommentLike.delete({ where: { commentId_userId: { commentId, userId } } })
    const count = await db.postCommentLike.count({ where: { commentId } })
    return NextResponse.json({ liked: false, count })
  } else {
    await db.postCommentLike.create({ data: { commentId, userId } })
    const count = await db.postCommentLike.count({ where: { commentId } })
    return NextResponse.json({ liked: true, count })
  }
}
