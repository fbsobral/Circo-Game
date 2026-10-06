import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import { FeedClient } from "./feed-client"
import { extractMentionNames } from "@/lib/mentions"
import { rankWithTies } from "@/lib/ranking"

async function MiniRanking() {
  const users = await db.user.findMany({
    where: { role: { in: ["student", "admin"] } },
    include: { starRecords: { select: { stars: true, absent: true, diamond: true } } },
  })

  const ranked = rankWithTies(users
    .map((u) => {
      const totalStars = u.starRecords.reduce((s, r) => s + (r.absent ? 0 : r.stars), 0)
      const totalDiamonds = u.starRecords.filter((r) => !r.absent && r.diamond).length
      const totalPoints = totalStars + totalDiamonds
      const expectedClasses = u.starRecords.filter((r) => r.absent || r.stars > 0).length
      const score = expectedClasses > 0 ? totalPoints / expectedClasses : 0
      return { ...u, totalStars, score }
    })
    .filter((u) => u.totalStars > 0))
    .filter((u) => u.rank <= 3)

  if (ranked.length < 1) return null

  const medals = ["🥇", "🥈", "🥉"]

  return (
    <Link href="/ranking" className="block">
      <div
        className="rounded-xl flex items-center gap-4 px-3 py-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ border: "1px solid rgba(201,168,76,0.2)", background: "rgba(201,168,76,0.06)" }}
      >
        <span
          className="text-xs font-bold tracking-widest flex-shrink-0"
          style={{ fontFamily: "var(--font-cormorant)", color: "var(--primary)", textTransform: "uppercase" }}
        >
          Ranking
        </span>
        {ranked.map((u) => (
          <span key={u.id} className="flex items-center gap-1.5 flex-shrink-0 text-sm">
            <span>{medals[u.rank - 1] ?? u.rank}</span>
            <span className="user-name font-medium">{u.name?.split(" ")[0]}</span>
            <span className="font-bold" style={{ fontFamily: "var(--font-cormorant)", color: u.rank === 1 ? "var(--star-active)" : "var(--primary)" }}>
              {u.score.toFixed(2)} ★
            </span>
          </span>
        ))}
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
      <MiniRanking />
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
