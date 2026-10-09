import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifyMentions } from "@/lib/mentions"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const comments = await db.classComment.findMany({
    where: { classId: id },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, image: true } },
      likes: { select: { userId: true } },
    },
  })
  return NextResponse.json(comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const { content, imageUrl } = await req.json()
  if (!content?.trim() && !imageUrl) return NextResponse.json({ error: "Conteúdo obrigatório" }, { status: 400 })
  if (imageUrl != null && (typeof imageUrl !== "string" || !imageUrl.startsWith("data:image/") || imageUrl.length > 3_000_000)) {
    return NextResponse.json({ error: "Imagem inválida ou grande demais" }, { status: 400 })
  }

  const comment = await db.classComment.create({
    data: { classId: id, authorId: session.user.id, content: (content ?? "").trim(), imageUrl: imageUrl ?? null },
    include: {
      author: { select: { id: true, name: true, image: true } },
      likes: { select: { userId: true } },
    },
  })
  const baseUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`
  notifyMentions(comment.content, session.user.id, comment.author.name ?? "Alguém", "comment", id, baseUrl, `${baseUrl}/aulas/${id}`)
    .catch(() => {})

  return NextResponse.json({ ...comment, createdAt: comment.createdAt.toISOString() }, { status: 201 })
}
