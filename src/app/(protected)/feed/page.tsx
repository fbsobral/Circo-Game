import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Avatar } from "@/components/ui/avatar"
import Link from "next/link"
import { FeedClient } from "./feed-client"
import { extractMentionNames } from "@/lib/mentions"

async function MiniRanking({ currentUserId }: { currentUserId: string }) {
  const currentUser = await db.user.findUnique({ where: { id: currentUserId }, select: { turma: true } })
  const myTurma = currentUser?.turma?.trim() || null

  const users = await db.user.findMany({
    where: {
      role: { in: ["student", "admin"] },
      ...(myTurma ? { turma: myTurma } : {}),
    },
    include: { starRecords: { select: { stars: true, absent: true, diamond: true } } },
    take: 50,
  })

  const ranked = users
    .map((u) => {
      const totalStars = u.starRecords.reduce((s, r) => s + (r.absent ? 0 : r.stars), 0)
      const totalDiamonds = u.starRecords.filter((r) => !r.absent && r.diamond).length
      const totalPoints = totalStars + totalDiamonds
      const expectedClasses = u.starRecords.length
      const score = expectedClasses > 0 ? totalPoints / expectedClasses : 0
      return { ...u, totalStars, score }
    })
    .filter((u) => u.totalStars > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  if (ranked.length < 1) return null

  const medals = ["🥇", "🥈", "🥉"]

  return (
    <Link href="/ranking" className="block group">
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(201,168,76,0.2)" }}>
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ background: "rgba(201,168,76,0.06)", borderBottom: "1px solid rgba(201,168,76,0.12)" }}
        >
          <div>
            <span
              className="text-sm font-bold tracking-widest"
              style={{ fontFamily: "var(--font-cormorant)", color: "var(--primary)", textTransform: "uppercase" }}
            >
              Ranking
            </span>
            {myTurma && <span className="ml-2 text-xs text-[var(--muted)]">{myTurma}</span>}
          </div>
          <span className="text-xs text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors">Ver tudo →</span>
        </div>
        <div className="divide-y divide-[var(--border)]" style={{ background: "var(--surface)" }}>
          {ranked.map((u, i) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-base w-5 text-center flex-shrink-0">{medals[i]}</span>
              <Avatar name={u.name} image={u.image} size="sm" totalStars={u.totalStars} />
              <span className="user-name text-sm font-medium flex-1 truncate">{u.name}</span>
              <span className="text-sm font-bold flex-shrink-0" style={{ fontFamily: "var(--font-cormorant)", color: i === 0 ? "var(--star-active)" : "var(--primary)" }}>
                {u.score.toFixed(1)} ★
              </span>
            </div>
          ))}
        </div>
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
      likes: { include: { user: { select: { id: true, name: true, image: true } } } },
      _count: { select: { comments: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        take: 3,
        include: {
          author: { select: { id: true, name: true, image: true } },
          likes: { select: { userId: true } },
        },
      },
    },
  })

  const nextCursor = initialData.length === 10 ? initialData[initialData.length - 1].id : null

  const allNames = [...new Set(initialData.flatMap((p) => [
    ...extractMentionNames(p.content),
    ...p.comments.flatMap((c) => extractMentionNames(c.content)),
  ]))]
  const mentionedUsers = allNames.length
    ? await db.user.findMany({ where: { name: { in: allNames, mode: "insensitive" } }, select: { id: true, name: true } })
    : []
  const mentionMap = Object.fromEntries(mentionedUsers.map((u) => [u.name!.toLowerCase(), u.id]))

  const serialized = initialData.map(({ comments, ...p }) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    recentComments: comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
    mentionMap,
  }))

  return (
    <div className="space-y-4">
      <MiniRanking currentUserId={userId} />
      <FeedClient
        initialPosts={serialized}
        nextCursor={nextCursor}
        currentUserId={userId}
        currentUserName={session!.user.name ?? ""}
        currentUserImage={session!.user.image ?? null}
      />
    </div>
  )
}
