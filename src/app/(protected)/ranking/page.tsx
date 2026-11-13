import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { rankWithTies } from "@/lib/ranking"
import { SCORE_RECORD_SELECT, formatPoints, scoreRecords } from "@/lib/scoring"
import { Suspense } from "react"
import { RankingFilters } from "./ranking-filters"
import { RankingInfo } from "./ranking-info"
import { RankingSeasons } from "./ranking-seasons"
import { listSeasons, seasonClassDateFilter, seasonStatus } from "@/lib/seasons"
import { formatDateShort } from "@/lib/utils"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Ranking" }


export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; season?: string }>
}) {
  const session = await auth()
  const { from, to, season: seasonParam } = await searchParams

  const seasons = (await listSeasons()).map((s) => ({ ...s, status: seasonStatus(s) }))
  const hasPeriodFilter = !!(from || to)
  // Sem filtro na URL, abre na temporada em andamento (se houver).
  const selectedSeason = hasPeriodFilter || seasonParam === "all"
    ? null
    : seasons.find((s) => (seasonParam ? s.id === seasonParam : s.status === "active")) ?? null

  const dateFilter = selectedSeason
    ? seasonClassDateFilter(selectedSeason)
    : {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
      }
  const hasDateFilter = hasPeriodFilter || !!selectedSeason

  const users = await db.user.findMany({
    where: { role: { in: ["student", "admin"] } },
    include: {
      starRecords: {
        where: hasDateFilter ? { class: { date: dateFilter } } : undefined,
        select: SCORE_RECORD_SELECT,
      },
    },
  })

  const ranked = rankWithTies(users
    .map((u) => ({ ...u, ...scoreRecords(u.starRecords, u.birthDate) }))
    .filter((u) => u.totalStars > 0 || !hasDateFilter))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
          <p className="text-sm mt-1" style={{ color: "var(--primary)" }}>
            {selectedSeason
              ? `${selectedSeason.name} · ${formatDateShort(selectedSeason.startDate)} – ${formatDateShort(selectedSeason.endDate)}${selectedSeason.status === "finished" ? " · encerrada" : selectedSeason.status === "upcoming" ? " · ainda não começou" : ""}`
              : hasPeriodFilter ? "Período personalizado" : "Geral · todas as aulas"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-[var(--muted)]">{ranked.length} participantes · pontuação por aula esperada</p>
            <RankingInfo />
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          {seasons.length > 0 && (
            <RankingSeasons
              seasons={seasons.map((s) => ({ id: s.id, name: s.name, status: s.status }))}
              selected={selectedSeason?.id ?? (hasPeriodFilter ? "period" : "all")}
            />
          )}
          <Suspense>
            <RankingFilters />
          </Suspense>
        </div>
      </div>

      {/* Full list */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
      >
        {ranked.map((student, i) => {
          const pos = student.rank - 1
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
                  fontSize: pos < 3 ? "1.2rem" : "0.9rem",
                  color: pos === 0 ? "#f0c040" : pos === 1 ? "#c0c0c0" : pos === 2 ? "#cd7f32" : "var(--muted)",
                }}
              >
                {pos < 3 ? medals[pos] : `${student.rank}`}
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
                  {student.classCount} aula{student.classCount !== 1 ? "s" : ""} · {student.totalStars} ★ total{student.totalDiamonds > 0 && ` · ${student.totalDiamonds} 💎`}{student.totalCakes > 0 && ` · ${student.totalCakes} 🎂`}{student.weeklyBonuses > 0 && ` · +${formatPoints(student.weeklyBonusPoints)} por 2ª aula na semana`}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span
                  className="font-bold"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "1.3rem",
                    color: pos === 0 ? "var(--star-active)" : "var(--text)",
                  }}
                >
                  {student.score.toFixed(2)}
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
