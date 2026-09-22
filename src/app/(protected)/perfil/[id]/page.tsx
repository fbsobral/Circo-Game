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
      weeklyFrequency: true,
      createdAt: true,
      starRecords: {
        include: { class: { select: { id: true, title: true, date: true } } },
        orderBy: { class: { date: "desc" } },
      },
    },
  })

  if (!user) notFound()

  const isMe = user.id === session!.user.id

  const totalStars = user.starRecords.reduce((s, r) => s + r.stars, 0)
  const classCount = user.starRecords.length

  // Calcular posição no ranking (mesmo algoritmo do ranking/page.tsx)
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
  const now = new Date()

  const allStudents = await db.user.findMany({
    where: { role: "student" },
    select: {
      id: true,
      weeklyFrequency: true,
      createdAt: true,
      starRecords: { select: { stars: true } },
    },
  })

  const scores = allStudents.map((u) => {
    const stars = u.starRecords.reduce((s, r) => s + r.stars, 0)
    const weeks = Math.max(1, Math.ceil((now.getTime() - u.createdAt.getTime()) / MS_PER_WEEK))
    return { id: u.id, score: stars / (u.weeklyFrequency * weeks) }
  })
  scores.sort((a, b) => b.score - a.score)

  const rankPosition = scores.findIndex((s) => s.id === id) + 1
  const myScore = scores.find((s) => s.id === id)?.score ?? 0

  const weeksEnrolled = Math.max(1, Math.ceil((now.getTime() - user.createdAt.getTime()) / MS_PER_WEEK))
  const expectedClasses = user.weeklyFrequency * weeksEnrolled

  const roleLabel = user.role === "admin" ? "Admin" : user.role === "professor" ? "Professor" : "Aluno"
  const freqLabel = user.weeklyFrequency === 2 ? "2× por semana" : "1× por semana"

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
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
              {user.role === "student" && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                  {freqLabel}
                </span>
              )}
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                desde {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {user.role === "student" && (
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
              <div
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-cormorant)", color: "var(--star-active)" }}
              >
                {myScore.toFixed(1)} ★
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>pontuação</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
              <div
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-cormorant)", color: "var(--primary)" }}
              >
                {rankPosition > 0 ? `#${rankPosition}` : "—"}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>no ranking</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
              <div
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                {classCount}/{expectedClasses}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>aulas</div>
            </div>
          </div>
        )}
      </div>

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
              <div key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.class.title || "Aula"}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{formatDate(r.class.date)}</div>
                  {r.note && (
                    <div className="text-xs mt-1 italic" style={{ color: "var(--muted)" }}>"{r.note}"</div>
                  )}
                </div>
                <StarsDisplay value={r.stars} size="sm" />
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
