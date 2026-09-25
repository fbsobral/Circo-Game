import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatDateShort, formatDate } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AulasPage() {
  const session = await auth()
  const role = (session!.user as { role: string }).role
  const isProfessorOrAdmin = role === "professor" || role === "admin"

  const classes = await db.class.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { starRecords: true } },
      starRecords: { select: { stars: true } },
      createdBy: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-8">
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
            Aulas
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">{classes.length} registradas</p>
        </div>
        {isProfessorOrAdmin && (
          <Link href="/aulas/nova">
            <Button size="sm">+ Registrar aula</Button>
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {classes.map((cls, i) => {
          const total = cls.starRecords.reduce((s: number, r: { stars: number }) => s + r.stars, 0)
          const avg = cls.starRecords.length ? (total / cls.starRecords.length).toFixed(1) : null
          const d = new Date(cls.date)
          const day = d.getDate().toString().padStart(2, "0")
          const month = d.toLocaleString("pt-BR", { month: "short" }).replace(".", "")

          return (
            <Link
              key={cls.id}
              href={`/aulas/${cls.id}`}
              className="flex items-center gap-5 group"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div
                className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-center transition-all duration-200 group-hover:scale-105"
                style={{
                  background: "linear-gradient(160deg, var(--surface) 0%, #0f0f20 100%)",
                  border: "1px solid var(--border-bright)",
                }}
              >
                <span className="text-lg font-bold leading-none" style={{ fontFamily: "var(--font-cormorant)", color: "var(--primary)" }}>{day}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{month}</span>
              </div>

              <div
                className="flex-1 flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-200 group-hover:border-[rgba(201,168,76,0.4)]"
                style={{
                  background: "linear-gradient(160deg, var(--surface) 0%, #0f0f20 100%)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.05rem" }}>
                    {cls.title || "Aula"}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">
                    {cls._count.starRecords} participante{cls._count.starRecords !== 1 ? "s" : ""}
                    {cls.createdBy?.name ? ` · ${cls.createdBy.name.split(" ")[0]}` : ""}
                  </div>
                </div>

                {avg ? (
                  <div className="text-right flex-shrink-0">
                    <div
                      className="text-xl font-bold"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        color: "var(--star-active)",
                        textShadow: "0 0 12px rgba(240,192,64,0.4)",
                      }}
                    >
                      {avg} ★
                    </div>
                    <div className="text-[10px] text-[var(--muted)]">média</div>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--muted)] flex-shrink-0">sem registros</span>
                )}

                <span
                  className="text-[var(--muted)] group-hover:text-[var(--primary)] transition-all duration-200 group-hover:translate-x-1 flex-shrink-0"
                >
                  →
                </span>
              </div>
            </Link>
          )
        })}

        {classes.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4 opacity-20" style={{ fontFamily: "var(--font-cormorant)" }}>★</div>
            <p className="text-sm text-[var(--muted)] mb-6">Nenhuma aula registrada ainda</p>
            {isProfessorOrAdmin && (
              <Link href="/aulas/nova"><Button size="sm">Criar primeira aula</Button></Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
