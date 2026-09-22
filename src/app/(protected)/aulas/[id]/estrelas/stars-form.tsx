"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar } from "@/components/ui/avatar"
import { StarsPicker } from "@/components/stars"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  name: string | null
  image: string | null
}

interface StudentRecord { stars: number; note: string; absent: boolean; included: boolean }

interface Props {
  classId: string
  students: Student[]
  initialRecords: Record<string, StudentRecord>
  initialTitle: string
  initialDate: string
  initialNotes: string
}

export function StarsForm({ classId, students, initialRecords, initialTitle, initialDate, initialNotes }: Props) {
  const router = useRouter()
  const [records, setRecords] = useState<Record<string, StudentRecord>>(initialRecords)
  const [expandedNote, setExpandedNote] = useState<string | null>(null)
  const [title, setTitle] = useState(initialTitle)
  const [date, setDate] = useState(initialDate)
  const [notes, setNotes] = useState(initialNotes)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  function getRecord(studentId: string): StudentRecord {
    return records[studentId] ?? { stars: 0, note: "", absent: false, included: false }
  }

  function updateRecord(studentId: string, patch: Partial<StudentRecord>) {
    setRecords((prev) => ({ ...prev, [studentId]: { ...getRecord(studentId), ...prev[studentId], ...patch } }))
  }

  function toggleIncluded(studentId: string) {
    const rec = getRecord(studentId)
    if (rec.included) {
      // removing from class: clear everything
      updateRecord(studentId, { included: false, stars: 0, note: "", absent: false })
      setExpandedNote((n) => (n === studentId ? null : n))
    } else {
      updateRecord(studentId, { included: true, absent: false })
    }
  }

  function toggleAbsent(studentId: string) {
    const rec = getRecord(studentId)
    const wasAbsent = rec.absent
    updateRecord(studentId, {
      absent: !wasAbsent,
      stars: wasAbsent ? rec.stars : 0,
      note: wasAbsent ? rec.note : "",
    })
    if (!wasAbsent) setExpandedNote((n) => (n === studentId ? null : n))
  }

  async function handleSave() {
    setLoading(true)
    setSaved(false)

    const recordsToSave = students
      .filter((s) => getRecord(s.id).included)
      .map((s) => {
        const { stars, note, absent } = getRecord(s.id)
        return {
          studentId: s.id,
          stars: absent ? 0 : stars,
          note: absent || !note ? undefined : note,
          absent,
        }
      })

    await Promise.all([
      fetch(`/api/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || null, date, notes: notes || null }),
      }),
      fetch(`/api/classes/${classId}/stars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: recordsToSave }),
      }),
    ])

    setLoading(false)
    setSaved(true)
    setTimeout(() => {
      router.push(`/aulas/${classId}`)
      router.refresh()
    }, 800)
  }

  const includedCount = students.filter((s) => getRecord(s.id).included).length
  const absentCount = students.filter((s) => { const r = getRecord(s.id); return r.included && r.absent }).length
  const withStars = students.filter((s) => { const r = getRecord(s.id); return r.included && !r.absent && r.stars > 0 }).length

  return (
    <div className="space-y-6">
      {/* Class fields */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] divide-y divide-[var(--border)]">
        <div className="px-5 py-4 flex items-center gap-4">
          <label className="text-xs text-[var(--muted)] w-16 flex-shrink-0">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome da aula (opcional)"
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none"
          />
        </div>
        <div className="px-5 py-4 flex items-center gap-4">
          <label className="text-xs text-[var(--muted)] w-16 flex-shrink-0">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[var(--text)] focus:outline-none"
            style={{ colorScheme: "dark" }}
          />
        </div>
        <div className="px-5 py-4 flex items-start gap-4">
          <label className="text-xs text-[var(--muted)] w-16 flex-shrink-0 pt-0.5">Observação</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observação sobre a aula (visível na página da aula)..."
            rows={2}
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Student records */}
      <div>
        <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>ALUNOS</div>
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] divide-y divide-[var(--border)]">
          {students.map((student) => {
            const rec = getRecord(student.id)
            const { stars, note, absent, included } = rec
            const isExpanded = expandedNote === student.id

            return (
              <div
                key={student.id}
                className="px-5 py-4 transition-colors"
                style={
                  !included
                    ? { opacity: 0.45 }
                    : absent
                    ? { background: "rgba(220,38,38,0.05)" }
                    : undefined
                }
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleIncluded(student.id)}
                    className={cn(
                      "w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors",
                      included
                        ? "bg-[var(--primary)] border-[var(--primary)]"
                        : "border-[var(--border)] hover:border-[var(--muted)]",
                    )}
                    aria-label={included ? "Remover da aula" : "Adicionar à aula"}
                  >
                    {included && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  <Avatar name={student.name} image={student.image} size="sm" className={absent ? "opacity-40" : undefined} />

                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium", absent && "line-through opacity-40")}>{student.name}</div>
                    {included && !absent && note && !isExpanded && (
                      <div className="text-xs text-[var(--muted)] italic truncate">"{note}"</div>
                    )}
                  </div>

                  {included && !absent && (
                    <>
                      <StarsPicker value={stars} onChange={(v) => updateRecord(student.id, { stars: v, absent: false })} />
                      <button
                        type="button"
                        onClick={() => setExpandedNote(isExpanded ? null : student.id)}
                        className={cn(
                          "text-xs px-2 py-1 rounded-md transition-colors",
                          note ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--text)]",
                        )}
                      >
                        nota
                      </button>
                    </>
                  )}

                  {included && (
                    <button
                      type="button"
                      onClick={() => toggleAbsent(student.id)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-md font-medium transition-colors flex-shrink-0",
                        absent
                          ? "bg-red-900/40 text-red-400 border border-red-800/60"
                          : "text-[var(--muted)] hover:text-red-400 hover:bg-red-900/20 border border-transparent",
                      )}
                    >
                      faltou
                    </button>
                  )}
                </div>

                {included && !absent && isExpanded && (
                  <div className="mt-3 pl-14">
                    <textarea
                      placeholder="Observação para o aluno (opcional, será enviada por e-mail)..."
                      value={note}
                      onChange={(e) => updateRecord(student.id, { note: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
                    />
                  </div>
                )}
              </div>
            )
          })}
          {students.length === 0 && (
            <div className="py-12 text-center text-sm text-[var(--muted)]">
              Nenhum aluno cadastrado ainda.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--muted)]">
          {includedCount} na aula
          {withStars > 0 && ` · ${withStars} com ★`}
          {absentCount > 0 && ` · ${absentCount} falta${absentCount !== 1 ? "s" : ""}`}
        </span>
        <Button
          onClick={handleSave}
          loading={loading}
          disabled={includedCount === 0}
          className={saved ? "bg-green-700 hover:bg-green-700" : ""}
        >
          {saved ? "Salvo! ✓" : "Salvar registro"}
        </Button>
      </div>
    </div>
  )
}
