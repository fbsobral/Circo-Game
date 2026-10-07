import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { FeedClient } from "../../feed/feed-client"
import { extractMentionNames } from "@/lib/mentions"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const post = await db.post.findUnique({ where: { id }, select: { content: true, author: { select: { name: true } } } })
  if (!post) return { title: "Post não encontrado" }
  const text = post.content.replace(/\s+/g, " ").trim()
  const short = text.length > 60 ? text.slice(0, 60).trimEnd() + "…" : text
  return {
    title: `${post.author.name ?? "Post"}: ${short}`,
    description: text.length > 160 ? text.slice(0, 160).trimEnd() + "…" : text,
  }
}


export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params

  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, image: true } },
      likes: { include: { user: { select: { id: true, name: true, image: true } } } },
      _count: { select: { comments: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          likes: { select: { userId: true } },
        },
      },
    },
  })
  if (!post) notFound()

  const names = [...new Set([
    ...extractMentionNames(post.content),
    ...post.comments.flatMap((c) => extractMentionNames(c.content)),
  ])]
  const mentioned = names.length
    ? await db.user.findMany({ where: { name: { in: names, mode: "insensitive" } }, select: { id: true, name: true } })
    : []
  const mentionMap = Object.fromEntries(mentioned.map((u) => [u.name!.toLowerCase(), u.id]))

  const { comments, ...rest } = post
  const serialized = {
    ...rest,
    createdAt: post.createdAt.toISOString(),
    recentComments: comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
    mentionMap,
  }

  return (
    <div className="space-y-4">
      <Link href="/feed" className="inline-block text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
        ← Feed
      </Link>
      <FeedClient
        initialPosts={[serialized]}
        nextCursor={null}
        currentUserId={session!.user.id}
        currentUserName={session!.user.name ?? ""}
        currentUserImage={session!.user.image ?? null}
        singlePost
      />
    </div>
  )
}
