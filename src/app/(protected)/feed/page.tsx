import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { FeedClient } from "./feed-client"
import { MiniRankingRow } from "./mini-ranking-row"
import { extractMentionNames } from "@/lib/mentions"
import { rankWithTies } from "@/lib/ranking"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Feed" }


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
    <MiniRankingRow
      entries={ranked.map((u) => ({
        id: u.id,
        medal: medals[u.rank - 1] ?? String(u.rank),
        name: u.name?.split(" ")[0] ?? "",
        score: u.score.toFixed(2),
        first: u.rank === 1,
      }))}
    />
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
        orderBy: { createdAt: "desc" },
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
    recentComments: [...comments].reverse().map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
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
