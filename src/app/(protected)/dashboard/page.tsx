import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card } from "@/components/ui/card"
import { StarsDisplay } from "@/components/stars"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user.id

  const [totalResult, rankingResult, recentRecords, classCount] = await Promise.all([
    db.starRecord.aggregate({ where: { studentId: userId }, _sum: { stars: true } }),
    db.$queryRaw<{ position: bigint }[]>`
      SELECT position FROM (
        SELECT "studentId", ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(stars), 0) DESC) AS position
        FROM "StarRecord"
        GROUP BY "studentId"
      ) r WHERE "studentId" = ${userId}
    `,
    db.starRecord.findMany({
      where: { studentId: userId },
      include: { class: true },
      orderBy: { class: { date: "desc" } },
      take: 5,
    }),
    db.starRecord.groupBy({ by: ["classId"], where: { studentId: userId }, _count: true }),
  ])

  const totalStars = totalResult._sum.stars ?? 0
  const position = rankingResult[0] ? Number(rankingResult[0].position) : null

  return (
    <div className="space-y-8">
      <div className="pt-4 text-center">
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
          Olá, <span className="user-name">{session!.user.name?.split(" ")[0]}</span>
        </h1>
        <p className="text-[var(--muted)] text-sm mt-1">seu desempenho até agora</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Stars card - hero */}
        <div
          className="rounded-2xl p-3 sm:p-6 text-center relative overflow-hidden col-span-1"
          style={{
            background: "linear-gradient(160deg, #1e1a10 0%, #16142a 40%, #111120 100%)",
            border: "1px solid rgba(201,168,76,0.4)",
            boxShadow: "0 0 40px rgba(201,168,76,0.12), 0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.8), transparent)" }} />
          <div
            className="text-3xl sm:text-5xl font-bold mb-1"
            style={{
              fontFamily: "var(--font-cormorant)",
              color: "var(--star-active)",
              textShadow: "0 0 30px rgba(240,192,64,0.6)",
            }}
          >
            {totalStars}
          </div>
          <div className="text-[10px] sm:text-xs text-[var(--muted)] uppercase tracking-widest">Estrelas</div>
        </div>

        <div
          className="rounded-2xl p-3 sm:p-6 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(160deg, var(--surface) 0%, #0f0f20 100%)",
            border: "1px solid var(--border-bright)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <div
            className="text-3xl sm:text-5xl font-bold mb-1"
            style={{ fontFamily: "var(--font-cormorant)", color: "var(--primary)" }}
          >
            {position ? `#${position}` : "—"}
          </div>
          <div className="text-[10px] sm:text-xs text-[var(--muted)] uppercase tracking-widest">Ranking</div>
        </div>

        <div
          className="rounded-2xl p-3 sm:p-6 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(160deg, var(--surface) 0%, #0f0f20 100%)",
            border: "1px solid var(--border-bright)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <div
            className="text-3xl sm:text-5xl font-bold mb-1"
            style={{ fontFamily: "var(--font-cormorant)", color: "var(--text)" }}
          >
            {classCount.length}
          </div>
          <div className="text-[10px] sm:text-xs text-[var(--muted)] uppercase tracking-widest">Aulas</div>
        </div>
      </div>

      {recentRecords.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.2rem" }}>
              Últimas aulas
            </h2>
            <Link href="/aulas" className="text-xs text-[var(--primary)] hover:opacity-80 transition-opacity">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-1">
            {recentRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
                <div>
                  <div className="text-sm font-medium">{r.class.title || "Aula"}</div>
                  <div className="text-xs text-[var(--muted)]">{formatDate(r.class.date)}</div>
                </div>
                <StarsDisplay value={r.stars} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
