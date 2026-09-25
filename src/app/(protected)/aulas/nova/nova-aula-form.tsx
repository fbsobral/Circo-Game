"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StarsPicker } from "@/components/stars"
import { Avatar } from "@/components/ui/avatar"
import Link from "next/link"

interface User {
  id: string
  name: string | null
  image: string | null
}

export function NovaAulaForm({ users }: { users: User[] }) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [stars, setStars] = useState<Record<string, number>>({})
  const [diamonds, setDiamonds] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [expandedNote, setExpandedNote] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const classRes = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date }),
    })
    if (!classRes.ok) {
      setError("Erro ao criar aula")
      setLoading(false)
      return
    }
    const cls = await classRes.json()

    const records = users.map((u) => ({
      studentId: u.id,
      stars: stars[u.id] ?? 0,
      note: notes[u.id] ?? "",
      diamond: diamonds[u.id] ?? false,
    }))

    const starsRes = await fetch(`/api/classes/${cls.id}/stars`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    })
    setLoading(false)
    if (!starsRes.ok) {
      setError("Aula criada, mas erro ao salvar estrelas")
      return
    }
    router.push(`/aulas/${cls.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4">
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1.5 uppercase tracking-wider">Título (opcional)</label>
          <Input
            placeholder="Ex: Acrobacia de solo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1.5 uppercase tracking-wider">Data</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] divide-y divide-[var(--border)]">
        <div className="px-5 py-3">
          <h2 className="text-sm font-medium">Estrelas por aluno</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">Padrão 0 estrelas — ajuste para quem participou</p>
        </div>
        {users.map((u) => (
          <div key={u.id} className="px-5 py-3.5 space-y-2">
            <div className="flex items-center gap-3">
              <Avatar name={u.name} image={u.image} size="sm" />
              <span className="flex-1 text-sm font-medium">{u.name}</span>
              <StarsPicker
                value={stars[u.id] ?? 0}
                onChange={(v) => setStars((s) => ({ ...s, [u.id]: v }))}
              />
              <button
                type="button"
                onClick={() => setDiamonds((d) => ({ ...d, [u.id]: !d[u.id] }))}
                title={diamonds[u.id] ? "Remover diamante" : "Conceder diamante (+1 ponto bônus)"}
                className="text-base px-1 transition-all"
                style={diamonds[u.id] ? { filter: "drop-shadow(0 0 6px #67e8f9)" } : { opacity: 0.25 }}
              >
                💎
              </button>
              <button
                type="button"
                onClick={() => setExpandedNote((n) => (n === u.id ? null : u.id))}
                className="text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
              >
                {expandedNote === u.id ? "▲" : "✎"}
              </button>
            </div>
            {expandedNote === u.id && (
              <textarea
                placeholder="Nota para o aluno (opcional)..."
                value={notes[u.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [u.id]: e.target.value }))}
                rows={2}
                className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
              />
            )}
          </div>
        ))}
        {users.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--muted)]">Nenhum usuário cadastrado ainda</div>
        )}
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="flex gap-3">
        <Link href="/aulas" className="flex-1">
          <Button variant="outline" type="button" className="w-full">Cancelar</Button>
        </Link>
        <Button type="submit" loading={loading} className="flex-1">
          Salvar aula
        </Button>
      </div>
    </form>
  )
}
