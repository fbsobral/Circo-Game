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

  if (ranked.length < 3) return null

  // podium order: [2nd, 1st, 3rd]
  const podium = [ranked[1], ranked[0], ranked[2]]

  return (
    <Link href="/ranking" className="block group">
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(201,168,76,0.2)" }}>
        {/* Header */}
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ background: "rgba(201,168,76,0.06)", borderBottom: "1px solid rgba(201,168,76,0.12)" }}
        >
          <span
            className="text-sm font-bold tracking-widest"
            style={{ fontFamily: "var(--font-cormorant)", color: "var(--primary)", textTransform: "uppercase" }}
          >
            Ranking
          </span>
          <span className="text-xs text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors">Ver tudo →</span>
        </div>

        <div className="p-4" style={{ background: "linear-gradient(160deg, rgba(17,17,28,0.95) 0%, rgba(12,12,22,0.98) 100%)" }}>
          {/* Mobile: winner on top, 2nd+3rd below */}
          <div className="md:hidden space-y-3">
            {/* Winner */}
            <div
              className="rounded-xl p-4 text-center flex flex-col items-center gap-2 relative overflow-hidden"
              style={{
                background: "linear-gradient(160deg, #1e1a10 0%, #16142a 40%, #111120 100%)",
                border: "1px solid rgba(201,168,76,0.5)",
                boxShadow: "0 0 30px rgba(201,168,76,0.12)",
              }}
            >
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.8), transparent)" }} />
              <span className="text-2xl" style={{ filter: "drop-shadow(0 0 6px rgba(201,168,76,0.8))" }}>🥇</span>
              <Avatar name={ranked[0].name} image={ranked[0].image} size="md" totalStars={ranked[0].total} />
              <div>
                <div className="user-name text-sm font-semibold truncate">{ranked[0].name}</div>
                <div className="font-bold" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.4rem", color: "var(--star-active)" }}>{ranked[0].total} ★</div>
              </div>
            </div>
            {/* 2nd and 3rd */}
            <div className="grid grid-cols-2 gap-3">
              {[ranked[1], ranked[2]].map((u, i) => (
                <div
                  key={u.id}
                  className="rounded-xl p-3 text-center flex flex-col items-center gap-2 opacity-90"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <span className="text-xl">{i === 0 ? "🥈" : "🥉"}</span>
                  <Avatar name={u.name} image={u.image} size="sm" totalStars={u.total} />
                  <div>
                    <div className="user-name text-xs font-semibold truncate">{u.name?.split(" ")[0]}</div>
                    <div className="font-bold" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem", color: "var(--primary)" }}>{u.total} ★</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: classic 3-col */}
          <div className="hidden md:grid grid-cols-3 gap-3">
            {podium.map((u, idx) => {
              const isWinner = idx === 1
              const actualPos = idx === 0 ? 1 : idx === 1 ? 0 : 2
              return (
                <div
                  key={u.id}
                  className="rounded-xl p-4 text-center flex flex-col items-center gap-2 relative overflow-hidden"
                  style={{
                    background: isWinner ? "linear-gradient(160deg, #1e1a10 0%, #16142a 40%, #111120 100%)" : "var(--surface)",
                    border: isWinner ? "1px solid rgba(201,168,76,0.5)" : "1px solid var(--border)",
                    boxShadow: isWinner ? "0 0 30px rgba(201,168,76,0.12)" : undefined,
                    transform: isWinner ? "scale(1.04)" : undefined,
                    opacity: isWinner ? 1 : 0.9,
                  }}
                >
                  {isWinner && <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.8), transparent)" }} />}
                  <span className="text-2xl" style={{ filter: isWinner ? "drop-shadow(0 0 6px rgba(201,168,76,0.8))" : undefined }}>{["🥇", "🥈", "🥉"][actualPos]}</span>
                  <Avatar name={u.name} image={u.image} size={isWinner ? "md" : "sm"} totalStars={u.total} />
                  <div>
                    <div className="user-name text-xs font-semibold truncate">{u.name?.split(" ")[0]}</div>
                    <div className="font-bold" style={{ fontFamily: "var(--font-cormorant)", fontSize: isWinner ? "1.3rem" : "1rem", color: isWinner ? "var(--star-active)" : "var(--primary)" }}>{u.total} ★</div>
                  </div>
                </div>
              )
            })}
          </div>
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
      likes: { select: { userId: true } },
      _count: { select: { comments: true } },
    },
  })

  const nextCursor = initialData.length === 10 ? initialData[initialData.length - 1].id : null

  const serialized = initialData.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
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
