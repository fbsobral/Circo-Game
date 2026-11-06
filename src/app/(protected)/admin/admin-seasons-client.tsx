"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDateShort } from "@/lib/utils"

type Status = "upcoming" | "active" | "finished"

export interface AdminSeason {
  id: string
  name: string
  startDate: string
  endDate: string
  status: Status
}

const statusLabels: Record<Status, string> = {
  upcoming: "Próxima",
  active: "Em andamento",
  finished: "Encerrada",
}

const statusColors: Record<Status, string> = {
  upcoming: "var(--muted)",
  active: "var(--primary)",
  finished: "var(--muted)",
}

const emptyForm = { name: "", startDate: "", endDate: "" }

export function AdminSeasonsClient({ seasons }: { seasons: AdminSeason[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | "new" | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function startNew() {
    setEditingId(editingId === "new" ? null : "new")
    setForm(emptyForm)
    setError("")
  }

  function startEdit(season: AdminSeason) {
    setEditingId(season.id)
    setForm({ name: season.name, startDate: season.startDate, endDate: season.endDate })
    setError("")
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const isNew = editingId === "new"
    const res = await fetch(isNew ? "/api/admin/seasons" : `/api/admin/seasons/${editingId}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar temporada")
      return
    }
    setEditingId(null)
    router.refresh()
  }

  async function remove(season: AdminSeason) {
    if (!confirm(`Remover a temporada "${season.name}"? As aulas e estrelas não são apagadas.`)) return
    setDeletingId(season.id)
    await fetch(`/api/admin/seasons/${season.id}`, { method: "DELETE" })
    setDeletingId(null)
    router.refresh()
  }

  const formEl = (
    <form onSubmit={save} className="space-y-3 rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      <Input
        placeholder="Nome (ex.: Temporada 1 — 2026)"
        value={form.name}
        maxLength={60}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs text-[var(--muted)] uppercase tracking-wider">Início</span>
          <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} required />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-[var(--muted)] uppercase tracking-wider">Fim</span>
          <Input type="date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} required />
        </label>
      </div>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
        <Button type="submit" size="sm" loading={saving}>Salvar</Button>
      </div>
    </form>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold">Temporadas ({seasons.length})</h2>
        <Button size="sm" onClick={startNew}>{editingId === "new" ? "Cancelar" : "+ Nova temporada"}</Button>
      </div>
      <p className="text-xs text-[var(--muted)] mb-4">
        Cada temporada é um ciclo do ranking: conta só as aulas entre o início e o fim. Os períodos não podem se sobrepor.
      </p>

      {editingId === "new" && <div className="mb-4">{formEl}</div>}

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
        {seasons.map((season, i) => (
          <div key={season.id} className={i !== seasons.length - 1 ? "border-b border-[var(--border)]" : undefined}>
            {editingId === season.id ? (
              <div className="p-3">{formEl}</div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{season.name}</span>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ color: statusColors[season.status], border: `1px solid ${statusColors[season.status]}` }}
                    >
                      {statusLabels[season.status]}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--muted)]">
                    {formatDateShort(season.startDate)} – {formatDateShort(season.endDate)}
                  </span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => startEdit(season)}>Editar</Button>
                <Button size="sm" variant="ghost" loading={deletingId === season.id} onClick={() => remove(season)}>Remover</Button>
              </div>
            )}
          </div>
        ))}
        {seasons.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--muted)]">Nenhuma temporada cadastrada</p>
        )}
      </div>
    </div>
  )
}
