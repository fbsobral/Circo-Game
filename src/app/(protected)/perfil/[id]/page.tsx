import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Avatar } from "@/components/ui/avatar"
import { StarsDisplay } from "@/components/stars"
import { formatDate } from "@/lib/utils"

export default async function PerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
      starRecords: {
        orderBy: { class: { date: "desc" } },
        select: { id: true, stars: true, note: true, absent: true, class: { select: { id: true, title: true, date: true } } },
      },
    },
  })

  if (!user) notFound()

  const isMe = user.id === session!.user.id

  const totalStars = user.starRecords.reduce((s, r) => s + (r.absent ? 0 : r.stars), 0)
  const classCount = user.starRecords.filter((r) => !r.absent).length
  const absentCount = user.starRecords.filter((r) => r.absent).length

  // Calcular posição no ranking (mesmo algoritmo do ranking/page.tsx)
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
  const now = new Date()

  const allStudents = await db.user.findMany({
    where: { role: "student" },
    select: {
      id: true,
      starRecords: { select: { stars: true, absent: true } },
    },
  })

  const scores = allStudents.map((u) => {
    const stars = u.starRecords.reduce((s, r) => s + (r.absent ? 0 : r.stars), 0)
    const expected = u.starRecords.length
    return { id: u.id, score: expected > 0 ? stars / expected : 0 }
  })
  scores.sort((a, b) => b.score - a.score)

  const rankPosition = scores.findIndex((s) => s.id === id) + 1
  const myScore = scores.find((s) => s.id === id)?.score ?? 0

  const expectedClasses = user.starRecords.length // presentes + faltou

  const roleLabel = user.role === "admin" ? "Admin" : user.role === "professor" ? "Professor" : "Aluno"

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #16162e 0%, #111120 100%)",
          border: "1px solid rgba(201,168,76,0.25)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)" }}
        />

        <div className="flex items-center gap-5">
          <Avatar name={user.name} image={user.image} size="xl" totalStars={totalStars} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-2xl font-bold truncate"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                {user.name ?? "Sem nome"}
              </h1>
              {isMe && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--primary-dim)", color: "var(--primary)", border: "1px solid rgba(201,168,76,0.2)" }}
                >
                  você
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: user.role === "admin" ? "rgba(201,168,76,0.15)" : "var(--surface-2)",
                  color: user.role === "admin" ? "var(--primary)" : "var(--muted)",
                }}
              >
                {roleLabel}
              </span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                desde {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {user.role === "student" && (
          <div className="grid grid-cols-4 gap-3 mt-5">
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
              <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-cormorant)", color: "var(--star-active)" }}>
                {myScore.toFixed(1)} ★
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>pontuação</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
              <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-cormorant)", color: "var(--primary)" }}>
                {rankPosition > 0 ? `#${rankPosition}` : "—"}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>no ranking</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
              <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-cormorant)" }}>
                {classCount}/{expectedClasses}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>presenças</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: absentCount > 0 ? "rgba(220,38,38,0.07)" : "rgba(255,255,255,0.04)", border: `1px solid ${absentCount > 0 ? "rgba(220,38,38,0.3)" : "var(--border)"}` }}>
              <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-cormorant)", color: absentCount > 0 ? "#f87171" : "var(--muted)" }}>
                {absentCount}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>faltas</div>
            </div>
          </div>
        )}
      </div>

      {/* Score breakdown */}
      {user.role === "student" && user.starRecords.length > 0 && (
        <div
          className="rounded-2xl px-5 py-4 text-sm space-y-1"
          style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.18)" }}
        >
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>COMO SUA PONTUAÇÃO É CALCULADA</div>
          <div className="flex justify-between gap-2">
            <span style={{ color: "var(--muted)" }}>Estrelas ganhas</span>
            <span className="font-medium" style={{ color: "var(--star-active)" }}>{totalStars} ★</span>
          </div>
          <div className="flex justify-between gap-2">
            <span style={{ color: "var(--muted)" }}>Aulas presentes</span>
            <span className="font-medium">{classCount}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span style={{ color: "var(--muted)" }}>Faltas registradas</span>
            <span className="font-medium" style={{ color: absentCount > 0 ? "#f87171" : undefined }}>{absentCount}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span style={{ color: "var(--muted)" }}>Total de aulas esperadas</span>
            <span className="font-medium">{expectedClasses}</span>
          </div>
          <div className="border-t pt-2 mt-2 flex justify-between gap-2 font-semibold" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
            <span>Pontuação ({totalStars} ÷ {expectedClasses})</span>
            <span style={{ color: "var(--star-active)" }}>{myScore.toFixed(2)} ★</span>
          </div>
          <div className="text-xs pt-0.5" style={{ color: "var(--muted)" }}>
            Máx. possível: 3,00 · quanto maior, mais consistente
          </div>
        </div>
      )}

      {/* Class history */}
      {user.starRecords.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>
            HISTÓRICO DE AULAS
          </h2>
          <div
            className="rounded-2xl overflow-hidden divide-y"
            style={{ border: "1px solid var(--border)", background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {user.starRecords.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 px-5 py-3.5"
                style={r.absent ? { background: "rgba(220,38,38,0.04)" } : undefined}
              >
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate${r.absent ? " opacity-50" : ""}`}>{r.class.title || "Aula"}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{formatDate(r.class.date)}</div>
                  {!r.absent && r.note && (
                    <div className="text-xs mt-1 italic" style={{ color: "var(--muted)" }}>"{r.note}"</div>
                  )}
                </div>
                {r.absent ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.3)" }}>
                    faltou
                  </span>
                ) : (
                  <StarsDisplay value={r.stars} size="sm" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {user.role === "student" && user.starRecords.length === 0 && (
        <div
          className="rounded-2xl py-12 text-center"
          style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
        >
          <div className="text-3xl mb-3 opacity-30">★</div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Nenhuma aula registrada ainda</p>
        </div>
      )}
    </div>
  )
}
