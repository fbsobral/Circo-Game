import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifyMentions } from "@/lib/mentions"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { commentId } = await params
  const comment = await db.classComment.findUnique({ where: { id: commentId }, select: { authorId: true } })
  if (!comment) return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 })
  if (comment.authorId !== session.user.id) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  await db.classComment.delete({ where: { id: commentId } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id, commentId } = await params
  const comment = await db.classComment.findUnique({ where: { id: commentId }, select: { authorId: true, content: true } })
  if (!comment) return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 })
  if (comment.authorId !== session.user.id) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Conteúdo obrigatório" }, { status: 400 })

  const updated = await db.classComment.update({ where: { id: commentId }, data: { content: content.trim() } })

  const baseUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`
  notifyMentions(updated.content, session.user.id, session.user.name ?? "Alguém", "comment", id, baseUrl, `${baseUrl}/aulas/${id}`, comment.content)
    .catch(() => {})

  return NextResponse.json({ id: updated.id, content: updated.content })
}
