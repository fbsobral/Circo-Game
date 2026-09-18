import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const post = await db.post.findUnique({ where: { id }, select: { authorId: true } })
  if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 })
  if (post.authorId !== session.user.id) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Conteúdo obrigatório" }, { status: 400 })

  const updated = await db.post.update({ where: { id }, data: { content: content.trim() } })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const post = await db.post.findUnique({ where: { id }, select: { authorId: true } })
  if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 })
  if (post.authorId !== session.user.id) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  await db.post.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
