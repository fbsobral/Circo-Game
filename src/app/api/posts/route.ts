import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifyMentions } from "@/lib/mentions"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor")
  const take = 10

  const posts = await db.post.findMany({
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, image: true } },
      likes: { select: { userId: true } },
      _count: { select: { comments: true } },
    },
  })

  const nextCursor = posts.length === take ? posts[posts.length - 1].id : null
  return NextResponse.json({ posts, nextCursor })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { content, imageUrl } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Conteúdo obrigatório" }, { status: 400 })
  if (content.length > 2000) return NextResponse.json({ error: "Máximo 2000 caracteres" }, { status: 400 })

  const post = await db.post.create({
    data: {
      authorId: session.user.id,
      content: content.trim(),
      imageUrl: imageUrl || null,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      likes: { select: { userId: true } },
      _count: { select: { comments: true } },
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`
  notifyMentions(post.content, session.user.id, post.author.name ?? "Alguém", "post", post.id, baseUrl)

  return NextResponse.json(post, { status: 201 })
}
