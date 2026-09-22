import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { StarsDisplay } from "@/components/stars"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DeleteClassButton } from "./delete-class-button"

export default async function AulaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params
  const role = (session!.user as { role: string }).role
  const userId = session!.user.id
  const isProfessorOrAdmin = role === "professor" || role === "admin"

  const cls = await db.class.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      starRecords: {
        include: { student: { select: { id: true, name: true, image: true } } },
        orderBy: [{ absent: "asc" }, { stars: "desc" }],
      },
    },
  })

  if (!cls) notFound()

  const presentRecords = cls.starRecords.filter((r: { absent: boolean }) => !r.absent)
  const avg = presentRecords.length
    ? (presentRecords.reduce((s: number, r: { stars: number }) => s + r.stars, 0) / presentRecords.length).toFixed(1)
    : null
  const absentCount = cls.starRecords.filter((r: { absent: boolean }) => r.absent).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-cormorant)" }}>
            {cls.title || "Aula"}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">{formatDate(cls.date)} · criada por {cls.createdBy.name}</p>
          {cls.notes && <p className="text-sm text-[var(--muted)] mt-2 italic">{cls.notes}</p>}
        </div>
        {isProfessorOrAdmin && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link href={`/aulas/${id}/estrelas`}>
              <Button size="sm">Editar registro</Button>
            </Link>
            <DeleteClassButton
              classId={id}
              isCreator={role === "admin" || cls.createdById === userId}
            />
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--star-active)]" style={{ fontFamily: "var(--font-cormorant)" }}>
            {avg ? `${avg} ★` : "—"}
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">Média da turma</div>
        </div>
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 text-center">
          <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-cormorant)" }}>
            {presentRecords.length}
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">Presentes</div>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ background: absentCount > 0 ? "rgba(220,38,38,0.07)" : "var(--surface)", borderColor: absentCount > 0 ? "rgba(220,38,38,0.3)" : "var(--border)" }}>
          <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-cormorant)", color: absentCount > 0 ? "#f87171" : "var(--muted)" }}>
            {absentCount}
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">Faltas</div>
        </div>
      </div>

      {/* Students */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] divide-y divide-[var(--border)]">
        {cls.starRecords.map((r) => (
          <div key={r.id} className="flex items-center gap-4 px-5 py-3.5" style={r.absent ? { background: "rgba(220,38,38,0.04)" } : undefined}>
            <Avatar name={r.student.name} image={r.student.image} size="sm" className={r.absent ? "opacity-40" : undefined} />
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium${r.absent ? " opacity-40 line-through" : ""}`}>{r.student.name}</div>
              {!r.absent && r.note && <div className="text-xs text-[var(--muted)] italic mt-0.5">"{r.note}"</div>}
            </div>
            {r.absent ? (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.3)" }}>
                faltou
              </span>
            ) : (
              <StarsDisplay value={r.stars} size="sm" />
            )}
          </div>
        ))}
        {cls.starRecords.length === 0 && (
          <div className="py-12 text-center text-sm text-[var(--muted)]">
            Nenhuma estrela registrada para esta aula.
            {isProfessorOrAdmin && (
              <div className="mt-4">
                <Link href={`/aulas/${id}/estrelas`}><Button size="sm">Registrar agora</Button></Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
