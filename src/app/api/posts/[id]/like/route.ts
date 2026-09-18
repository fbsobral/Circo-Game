import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const userId = session.user.id

  const existing = await db.postLike.findUnique({ where: { postId_userId: { postId: id, userId } } })

  if (existing) {
    await db.postLike.delete({ where: { postId_userId: { postId: id, userId } } })
    const count = await db.postLike.count({ where: { postId: id } })
    return NextResponse.json({ liked: false, count })
  } else {
    await db.postLike.create({ data: { postId: id, userId } })
    const count = await db.postLike.count({ where: { postId: id } })
    return NextResponse.json({ liked: true, count })
  }
}
