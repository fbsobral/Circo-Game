"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

export function RankingFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    startTransition(() => router.push(`/ranking?${next.toString()}`))
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <label className="text-xs text-[var(--muted)] uppercase tracking-wider whitespace-nowrap">De</label>
        <input
          type="date"
          defaultValue={params.get("from") ?? ""}
          onChange={(e) => update("from", e.target.value)}
          className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-[var(--muted)] uppercase tracking-wider whitespace-nowrap">Até</label>
        <input
          type="date"
          defaultValue={params.get("to") ?? ""}
          onChange={(e) => update("to", e.target.value)}
          className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors"
        />
      </div>
      {(params.get("from") || params.get("to")) && (
        <button
          onClick={() => { update("from", ""); update("to", "") }}
          className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          Limpar filtro
        </button>
      )}
    </div>
  )
}
