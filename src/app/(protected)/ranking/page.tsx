import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Suspense } from "react"
import { RankingFilters } from "./ranking-filters"
import { RankingInfo } from "./ranking-info"
import Link from "next/link"

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await auth()
  const { from, to } = await searchParams

  const dateFilter = {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
  }
  const hasDateFilter = from || to

  const users = await db.user.findMany({
    where: { role: { in: ["student", "admin"] } },
    include: {
      starRecords: {
        where: hasDateFilter ? { class: { date: dateFilter } } : undefined,
        select: { stars: true, absent: true, diamond: true },
      },
    },
  })

  const ranked = users
    .map((u) => {
      const totalStars = u.starRecords.reduce((sum: number, r: { stars: number; absent: boolean; diamond: boolean }) => sum + (r.absent ? 0 : r.stars), 0)
      const totalDiamonds = u.starRecords.filter((r: { absent: boolean; diamond: boolean }) => !r.absent && r.diamond).length
      const totalPoints = totalStars + totalDiamonds
      const expectedClasses = u.starRecords.filter((r: { absent: boolean; stars: number }) => r.absent || r.stars > 0).length
      const classCount = u.starRecords.filter((r: { absent: boolean }) => !r.absent).length
      const score = expectedClasses > 0 ? totalPoints / expectedClasses : 0
      return { ...u, totalStars, totalDiamonds, totalPoints, classCount, score, expectedClasses }
    })
    .filter((u) => u.totalStars > 0 || !hasDateFilter)
    .sort((a, b) => b.score - a.score)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1
            className="text-4xl font-bold"
            style={{
              fontFamily: "var(--font-cormorant)",
              background: "linear-gradient(135deg, #c9a84c 0%, #f0c878 50%, #c9a84c 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Ranking
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-[var(--muted)]">{ranked.length} participantes · pontuação por aula esperada</p>
            <RankingInfo />
          </div>
        </div>
        <Suspense>
          <RankingFilters />
        </Suspense>
      </div>

      {/* Full list */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
      >
        {ranked.map((student, i) => {
          const isMe = student.id === session!.user.id
          const medals = ["🥇", "🥈", "🥉"]

          return (
            <Link
              key={student.id}
              href={`/perfil/${student.id}`}
              className={cn(
                "flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface-2)]",
                isMe && "bg-[var(--primary-dim)]",
                i !== ranked.length - 1 && "border-b border-[var(--border)]",
              )}
            >
              <span
                className="w-8 text-center flex-shrink-0 font-bold"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: i < 3 ? "1.2rem" : "0.9rem",
                  color: i === 0 ? "#f0c040" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "var(--muted)",
                }}
              >
                {i < 3 ? medals[i] : `${i + 1}`}
              </span>

              <Avatar name={student.name} image={student.image} size="sm" totalStars={student.totalStars} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="user-name text-sm font-medium truncate">{student.name}</span>
                  {isMe && (
                    <span className="text-[10px] font-medium text-[var(--primary)] bg-[var(--primary-dim)] border border-[var(--primary)]/20 px-1.5 py-0.5 rounded-full">
                      você
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {student.classCount} aula{student.classCount !== 1 ? "s" : ""} · {student.totalStars} ★ total{student.totalDiamonds > 0 && ` · ${student.totalDiamonds} 💎`}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span
                  className="font-bold"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "1.3rem",
                    color: i === 0 ? "var(--star-active)" : "var(--text)",
                  }}
                >
                  {student.score.toFixed(1)}
                </span>
                <span className="text-xs text-[var(--muted)]">★</span>
              </div>
            </Link>
          )
        })}

        {ranked.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3 opacity-30">★</div>
            <p className="text-sm text-[var(--muted)]">Nenhum resultado para este período</p>
          </div>
        )}
      </div>
    </div>
  )
}
