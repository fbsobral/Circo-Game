import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Suspense } from "react"
import { RankingFilters } from "./ranking-filters"

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
    where: { role: "student" },
    include: {
      starRecords: {
        where: hasDateFilter ? { class: { date: dateFilter } } : undefined,
        select: { stars: true },
      },
    },
  })

  const ranked = users
    .map((u) => ({
      ...u,
      totalStars: u.starRecords.reduce((sum: number, r: { stars: number }) => sum + r.stars, 0),
      classCount: u.starRecords.length,
    }))
    .filter((u) => u.totalStars > 0 || !hasDateFilter)
    .sort((a, b) => b.totalStars - a.totalStars)

  const podium = ranked.length >= 3 ? [ranked[1], ranked[0], ranked[2]] : null

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
          <p className="text-sm text-[var(--muted)] mt-1">{ranked.length} participantes · ordenado por estrelas</p>
        </div>
        <Suspense>
          <RankingFilters />
        </Suspense>
      </div>

      {/* Podium */}
      {podium && (
        <div className="relative">
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)", filter: "blur(20px)" }}
          />

          {/* Mobile: winner on top, 2nd+3rd below */}
          <div className="md:hidden space-y-3 relative">
            {/* Winner */}
            {(() => {
              const student = podium[1]
              return (
                <div
                  key={student.id}
                  className="rounded-2xl p-5 text-center flex flex-col items-center gap-3 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(160deg, #1e1a10 0%, #16142a 40%, #111120 100%)",
                    border: "1px solid rgba(201,168,76,0.5)",
                    boxShadow: "0 0 40px rgba(201,168,76,0.15), 0 20px 60px rgba(0,0,0,0.5)",
                  }}
                >
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.8), transparent)" }} />
                  <span className="text-3xl" style={{ filter: "drop-shadow(0 0 8px rgba(201,168,76,0.8))" }}>🥇</span>
                  <Avatar name={student.name} image={student.image} size="lg" totalStars={student.totalStars} />
                  <div className="w-full">
                    <div className="user-name text-base font-semibold truncate" style={{ fontFamily: "var(--font-inter), sans-serif", textTransform: "none" }}>{student.name}</div>
                    <div className="font-bold mt-1" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.8rem", color: "var(--star-active)", textShadow: "0 0 20px rgba(240,192,64,0.5)" }}>{student.totalStars} ★</div>
                  </div>
                </div>
              )
            })()}
            {/* 2nd and 3rd */}
            <div className="grid grid-cols-2 gap-3">
              {[podium[0], podium[2]].map((student, i) => (
                <div
                  key={student.id}
                  className="rounded-2xl p-4 text-center flex flex-col items-center gap-2 relative overflow-hidden opacity-90"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
                >
                  <span className="text-2xl">{i === 0 ? "🥈" : "🥉"}</span>
                  <Avatar name={student.name} image={student.image} size="md" totalStars={student.totalStars} />
                  <div className="w-full">
                    <div className="user-name text-xs font-semibold truncate" style={{ fontFamily: "var(--font-inter), sans-serif", textTransform: "none" }}>{student.name}</div>
                    <div className="font-bold mt-0.5" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.1rem", color: "var(--primary)" }}>{student.totalStars} ★</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: classic 3-col (silver | gold | bronze) */}
          <div className="hidden md:grid grid-cols-3 gap-3 relative">
            {podium.map((student, idx) => {
              const actualPos = idx === 0 ? 1 : idx === 1 ? 0 : 2
              const isWinner = idx === 1
              return (
                <div
                  key={student.id}
                  className={cn(
                    "rounded-2xl p-5 text-center flex flex-col items-center gap-3 relative overflow-hidden transition-transform",
                    isWinner ? "scale-105" : "scale-100 opacity-90",
                  )}
                  style={{
                    background: isWinner ? "linear-gradient(160deg, #1e1a10 0%, #16142a 40%, #111120 100%)" : "var(--surface)",
                    border: isWinner ? "1px solid rgba(201,168,76,0.5)" : "1px solid var(--border)",
                    boxShadow: isWinner ? "0 0 40px rgba(201,168,76,0.15), 0 20px 60px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.3)",
                  }}
                >
                  {isWinner && <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.8), transparent)" }} />}
                  <span className="text-3xl" style={{ filter: isWinner ? "drop-shadow(0 0 8px rgba(201,168,76,0.8))" : undefined }}>{["🥇", "🥈", "🥉"][actualPos]}</span>
                  <Avatar name={student.name} image={student.image} size={isWinner ? "lg" : "md"} totalStars={student.totalStars} />
                  <div className="w-full">
                    <div className="user-name text-sm font-semibold truncate" style={{ fontSize: isWinner ? "1.1rem" : undefined, fontFamily: "var(--font-inter), sans-serif", textTransform: "none" }}>{student.name}</div>
                    <div className="font-bold mt-1" style={{ fontFamily: "var(--font-cormorant)", fontSize: isWinner ? "1.6rem" : "1.2rem", color: isWinner ? "var(--star-active)" : "var(--primary)", textShadow: isWinner ? "0 0 20px rgba(240,192,64,0.5)" : undefined }}>{student.totalStars} ★</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Full list */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
      >
        {ranked.map((student, i) => {
          const isMe = student.id === session!.user.id
          const medals = ["🥇", "🥈", "🥉"]

          return (
            <div
              key={student.id}
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
                  {student.classCount} aula{student.classCount !== 1 ? "s" : ""}
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
                  {student.totalStars}
                </span>
                <span className="text-xs text-[var(--muted)]">★</span>
              </div>
            </div>
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
