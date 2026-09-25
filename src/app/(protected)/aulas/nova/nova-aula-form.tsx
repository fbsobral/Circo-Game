"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StarsPicker } from "@/components/stars"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface User {
  id: string
  name: string | null
  image: string | null
}

interface StudentRecord { stars: number; note: string; absent: boolean; included: boolean; diamond: boolean }

export function NovaAulaForm({ users }: { users: User[] }) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [classNotes, setClassNotes] = useState("")
  const [records, setRecords] = useState<Record<string, StudentRecord>>({})
  const [expandedNote, setExpandedNote] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function getRecord(id: string): StudentRecord {
    return records[id] ?? { stars: 0, note: "", absent: false, included: false, diamond: false }
  }

  function updateRecord(id: string, patch: Partial<StudentRecord>) {
    setRecords((prev) => ({ ...prev, [id]: { ...getRecord(id), ...prev[id], ...patch } }))
  }

  function toggleIncluded(id: string) {
    const rec = getRecord(id)
    if (rec.included) {
      updateRecord(id, { included: false, stars: 0, note: "", absent: false, diamond: false })
      setExpandedNote((n) => (n === id ? null : n))
    } else {
      updateRecord(id, { included: true, absent: false })
    }
  }

  function toggleAbsent(id: string) {
    const rec = getRecord(id)
    const wasAbsent = rec.absent
    updateRecord(id, {
      absent: !wasAbsent,
      stars: wasAbsent ? rec.stars : 0,
      note: wasAbsent ? rec.note : "",
      diamond: wasAbsent ? rec.diamond : false,
    })
    if (!wasAbsent) setExpandedNote((n) => (n === id ? null : n))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const classRes = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date, notes: classNotes || null }),
    })
    if (!classRes.ok) {
      setError("Erro ao criar aula")
      setLoading(false)
      return
    }
    const cls = await classRes.json()

    const included = users.filter((u) => getRecord(u.id).included)
    if (included.length === 0) {
      router.push(`/aulas/${cls.id}`)
      return
    }

    const recordsToSave = included.map((u) => {
      const { stars, note, absent, diamond } = getRecord(u.id)
      return { studentId: u.id, stars: absent ? 0 : stars, note: absent || !note ? undefined : note, absent, diamond: absent ? false : diamond }
    })

    const starsRes = await fetch(`/api/classes/${cls.id}/stars`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: recordsToSave }),
    })
    setLoading(false)
    if (!starsRes.ok) {
      setError("Aula criada, mas erro ao salvar estrelas")
      return
    }
    router.push(`/aulas/${cls.id}`)
  }

  const includedCount = users.filter((u) => getRecord(u.id).included).length
  const absentCount = users.filter((u) => { const r = getRecord(u.id); return r.included && r.absent }).length
  const withDiamond = users.filter((u) => { const r = getRecord(u.id); return r.included && !r.absent && r.diamond }).length

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Class fields */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] divide-y divide-[var(--border)]">
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)]">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da aula (opcional)"
              className="bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)]">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="bg-transparent text-sm text-[var(--text)] focus:outline-none"
              style={{ colorScheme: "dark" }}
            />
          </div>
        </div>
        <div className="px-5 py-4 flex items-start gap-4">
          <label className="text-xs text-[var(--muted)] w-20 flex-shrink-0 pt-0.5">Observação</label>
          <textarea
            value={classNotes}
            onChange={(e) => setClassNotes(e.target.value)}
            placeholder="Observação sobre a aula..."
            rows={2}
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Students */}
      <div>
        <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>ALUNOS</div>
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] divide-y divide-[var(--border)]">
          {users.map((u) => {
            const rec = getRecord(u.id)
            const { stars, note, absent, included, diamond } = rec
            const isExpanded = expandedNote === u.id

            return (
              <div
                key={u.id}
                className="px-5 py-4 transition-colors"
                style={!included ? { opacity: 0.45 } : absent ? { background: "rgba(220,38,38,0.05)" } : undefined}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleIncluded(u.id)}
                    className={cn(
                      "w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors",
                      included ? "bg-[var(--primary)] border-[var(--primary)]" : "border-[var(--border)] hover:border-[var(--muted)]",
                    )}
                    aria-label={included ? "Remover da aula" : "Adicionar à aula"}
                  >
                    {included && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  <Avatar name={u.name} image={u.image} size="sm" className={absent ? "opacity-40" : undefined} />

                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium", absent && "line-through opacity-40")}>{u.name}</div>
                    {included && !absent && note && !isExpanded && (
                      <div className="text-xs text-[var(--muted)] italic truncate">"{note}"</div>
                    )}
                  </div>

                  {included && !absent && (
                    <>
                      <StarsPicker value={stars} onChange={(v) => updateRecord(u.id, { stars: v, absent: false })} />
                      <button
                        type="button"
                        onClick={() => {
                          const next = !diamond
                          updateRecord(u.id, { diamond: next, ...(next ? { stars: 3 } : {}) })
                        }}
                        title={diamond ? "Remover diamante" : "Conceder diamante (+1 ponto bônus)"}
                        className={cn("text-base px-1.5 py-0.5 rounded-md transition-all", diamond ? "opacity-100 scale-110" : "opacity-25 hover:opacity-60")}
                        style={diamond ? { filter: "drop-shadow(0 0 6px #67e8f9)" } : undefined}
                      >
                        💎
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedNote(isExpanded ? null : u.id)}
                        className={cn("text-xs px-2 py-1 rounded-md transition-colors", note ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--text)]")}
                      >
                        nota
                      </button>
                    </>
                  )}

                  {included && (
                    <button
                      type="button"
                      onClick={() => toggleAbsent(u.id)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-md font-medium transition-colors flex-shrink-0",
                        absent ? "bg-red-900/40 text-red-400 border border-red-800/60" : "text-[var(--muted)] hover:text-red-400 hover:bg-red-900/20 border border-transparent",
                      )}
                    >
                      faltou
                    </button>
                  )}
                </div>

                {included && !absent && isExpanded && (
                  <div className="mt-3 pl-14">
                    <textarea
                      placeholder="Observação para o aluno (opcional)..."
                      value={note}
                      onChange={(e) => updateRecord(u.id, { note: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
                    />
                  </div>
                )}
              </div>
            )
          })}
          {users.length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--muted)]">Nenhum usuário cadastrado ainda</div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--muted)]">
          {includedCount} na aula
          {withDiamond > 0 && ` · ${withDiamond} 💎`}
          {absentCount > 0 && ` · ${absentCount} falta${absentCount !== 1 ? "s" : ""}`}
        </span>
        <div className="flex gap-3">
          <Link href="/aulas">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" loading={loading}>
            Salvar aula
          </Button>
        </div>
      </div>
    </form>
  )
}
