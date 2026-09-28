import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { commentId } = await params
  const comment = await db.postComment.findUnique({ where: { id: commentId }, select: { authorId: true } })
  if (!comment) return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 })
  if (comment.authorId !== session.user.id) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  await db.postComment.delete({ where: { id: commentId } })
  return NextResponse.json({ ok: true })
}
