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

interface Props {
  classId: string
  students: Student[]
  initialRecords: Record<string, { stars: number; note: string }>
}

export function StarsForm({ classId, students, initialRecords }: Props) {
  const router = useRouter()
  const [records, setRecords] = useState<Record<string, { stars: number; note: string }>>(initialRecords)
  const [expandedNote, setExpandedNote] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  function setStars(studentId: string, stars: number) {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { stars, note: prev[studentId]?.note ?? "" },
    }))
  }

  function setNote(studentId: string, note: string) {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { stars: prev[studentId]?.stars ?? 0, note },
    }))
  }

  async function handleSave() {
    setLoading(true)
    setSaved(false)
    const recordsToSave = Object.entries(records).map(([studentId, { stars, note }]) => ({
      studentId,
      stars,
      note: note || undefined,
    }))

    await fetch(`/api/classes/${classId}/stars`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: recordsToSave }),
    })

    setLoading(false)
    setSaved(true)
    setTimeout(() => {
      router.push(`/aulas/${classId}`)
      router.refresh()
    }, 800)
  }

  const totalRegistered = Object.values(records).filter((r) => r.stars > 0).length

  return (
    <div>
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] divide-y divide-[var(--border)] mb-6">
        {students.map((student) => {
          const rec = records[student.id]
          const stars = rec?.stars ?? 0
          const note = rec?.note ?? ""
          const isExpanded = expandedNote === student.id

          return (
            <div key={student.id} className="px-5 py-4">
              <div className="flex items-center gap-4">
                <Avatar name={student.name} image={student.image} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{student.name}</div>
                  {note && !isExpanded && (
                    <div className="text-xs text-[var(--muted)] italic truncate">"{note}"</div>
                  )}
                </div>
                <StarsPicker value={stars} onChange={(v) => setStars(student.id, v)} />
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
              </div>
              {isExpanded && (
                <div className="mt-3 pl-12">
                  <textarea
                    placeholder="Observação para o aluno (opcional, será enviada por e-mail)..."
                    value={note}
                    onChange={(e) => setNote(student.id, e.target.value)}
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

      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--muted)]">
          {totalRegistered}/{students.length} alunos com estrelas
        </span>
        <Button
          onClick={handleSave}
          loading={loading}
          disabled={students.length === 0}
          className={saved ? "bg-green-700 hover:bg-green-700" : ""}
        >
          {saved ? "Salvo! ✓" : "Salvar aula"}
        </Button>
      </div>
    </div>
  )
}
