import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Avatar } from "@/components/ui/avatar"
import Link from "next/link"
import { FeedClient } from "./feed-client"

async function MiniRanking() {
  const top = await db.user.findMany({
    where: { role: "student" },
    include: { starRecords: { select: { stars: true } } },
    take: 50,
  })

  const ranked = top
    .map((u) => ({ ...u, total: u.starRecords.reduce((s, r) => s + r.stars, 0) }))
    .filter((u) => u.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)

  if (ranked.length === 0) return null

  const medals = ["🥇", "🥈", "🥉"]

  return (
    <Link href="/ranking" className="block group">
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3 transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(17,17,32,0.8) 100%)",
          border: "1px solid rgba(201,168,76,0.2)",
        }}
      >
        <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-widest flex-shrink-0">Ranking</span>
        <div className="flex-1 flex items-center gap-3 overflow-hidden">
          {ranked.map((u, i) => (
            <div key={u.id} className="flex items-center gap-1.5 min-w-0">
              <span className="text-base flex-shrink-0">{medals[i]}</span>
              <Avatar name={u.name} image={u.image} size="sm" totalStars={u.total} />
              <span className="user-name text-xs font-medium truncate hidden sm:block">{u.name?.split(" ")[0]}</span>
              <span className="text-xs text-[var(--primary)] font-semibold flex-shrink-0">{u.total}★</span>
            </div>
          ))}
        </div>
        <span className="text-xs text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors flex-shrink-0">Ver tudo →</span>
      </div>
    </Link>
  )
}

export default async function FeedPage() {
  const session = await auth()
  const userId = session!.user.id

  const initialData = await db.post.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, image: true } },
      likes: { select: { userId: true } },
      _count: { select: { comments: true } },
    },
  })

  const nextCursor = initialData.length === 10 ? initialData[initialData.length - 1].id : null

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <MiniRanking />
      <FeedClient
        initialPosts={initialData}
        nextCursor={nextCursor}
        currentUserId={userId}
        currentUserName={session!.user.name ?? ""}
        currentUserImage={session!.user.image ?? null}
      />
    </div>
  )
}
