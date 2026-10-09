import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { StarsDisplay } from "@/components/stars"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DeleteClassButton } from "./delete-class-button"
import { ClassComments } from "./class-comments"
import { ClassReviewForm } from "./class-review-form"
import { extractMentionNames } from "@/lib/mentions"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const cls = await db.class.findUnique({ where: { id }, select: { title: true, date: true } })
  if (!cls) return { title: "Aula não encontrada" }
  return { title: `${cls.title || "Aula"} · ${formatDate(cls.date)}` }
}


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
        orderBy: [{ absent: "asc" }, { diamond: "desc" }, { stars: "desc" }],
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          likes: { select: { userId: true } },
        },
      },
    },
  })

  if (!cls) notFound()

  const presentRecords = cls.starRecords.filter((r: { absent: boolean }) => !r.absent)
  const avg = presentRecords.length
    ? (presentRecords.reduce((s: number, r: { stars: number }) => s + r.stars, 0) / presentRecords.length).toFixed(1)
    : null
  const absentCount = cls.starRecords.filter((r: { absent: boolean }) => r.absent).length

  const myRecord = cls.starRecords.find((r) => r.student.id === userId && !r.absent)
  const myReview = myRecord
    ? await db.classReview.findUnique({ where: { classId_studentId: { classId: id, studentId: userId } } })
    : null
  const reviews = isProfessorOrAdmin
    ? await db.classReview.findMany({
        where: { classId: id },
        orderBy: { createdAt: "desc" },
        include: { student: { select: { id: true, name: true, image: true } } },
      })
    : []
  const reviewAvg = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : null

  const mentionNames = [...new Set(cls.comments.flatMap((c) => extractMentionNames(c.content)))].filter((n) => n.toLowerCase() !== "todos")
  const mentionedUsers = mentionNames.length
    ? await db.user.findMany({ where: { name: { in: mentionNames, mode: "insensitive" } }, select: { id: true, name: true } })
    : []
  const mentionMap = Object.fromEntries(mentionedUsers.map((u) => [u.name!.toLowerCase(), u.id]))

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
            <Link href={`/perfil/${r.student.id}`} className="flex-shrink-0">
              <Avatar name={r.student.name} image={r.student.image} size="sm" className={r.absent ? "opacity-40" : undefined} />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/perfil/${r.student.id}`} className={`user-name text-sm font-medium hover:underline${r.absent ? " opacity-40 line-through" : ""}`}>{r.student.name}</Link>
              {!r.absent && r.note && <div className="text-xs text-[var(--muted)] italic mt-0.5">"{r.note}"</div>}
            </div>
            {r.absent ? (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.3)" }}>
                faltou
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <StarsDisplay value={r.stars} size="sm" />
                {r.diamond && <span className="text-base" title="Diamante" style={{ filter: "drop-shadow(0 0 4px #67e8f9)" }}>💎</span>}
              </div>
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
      {/* Student review (feedback to the teacher) */}
      {myRecord && (
        <ClassReviewForm classId={id} initialStars={myReview?.stars ?? 0} initialComment={myReview?.comment ?? ""} />
      )}

      {/* Teacher view of student reviews */}
      {isProfessorOrAdmin && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
            <div>
              <h2 className="font-semibold" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.25rem" }}>Avaliações dos alunos</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">Feedback sobre a aula · não entra no ranking</p>
            </div>
            {reviewAvg !== null && (
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-cormorant)", color: "var(--star-active)" }}>
                  {reviewAvg.toFixed(1)} ★
                </div>
                <div className="text-[11px] text-[var(--muted)]">{reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}</div>
              </div>
            )}
          </div>
          {reviews.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--muted)]">Nenhuma avaliação ainda.</div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {reviews.map((r) => (
                <div key={r.id} className="flex gap-3 px-5 py-3.5">
                  <Link href={`/perfil/${r.student.id}`} className="flex-shrink-0">
                    <Avatar name={r.student.name} image={r.student.image} size="sm" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/perfil/${r.student.id}`} className="user-name text-sm font-medium hover:underline truncate">{r.student.name}</Link>
                      <span className="text-sm flex-shrink-0" style={{ color: "var(--star-active)" }} aria-label={`${r.stars} de 5`}>
                        {"★".repeat(r.stars)}<span style={{ color: "var(--border-bright, #444466)" }}>{"★".repeat(5 - r.stars)}</span>
                      </span>
                    </div>
                    {r.comment && <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap">{r.comment}</p>}
                    <div className="text-[11px] text-[var(--muted)] mt-1">{formatDate(r.updatedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      <ClassComments
        mentionMap={mentionMap}
        classId={id}
        currentUserId={userId}
        initialComments={cls.comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
      />
    </div>
  )
}
