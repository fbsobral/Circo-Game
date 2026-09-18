"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useState } from "react"

export function RankingFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()
  const hasFilter = !!(params.get("from") || params.get("to"))
  const [open, setOpen] = useState(hasFilter)

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    startTransition(() => router.push(`/ranking?${next.toString()}`))
  }

  function clear() {
    update("from", "")
    update("to", "")
    setOpen(false)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
        style={{
          background: hasFilter ? "var(--primary-dim)" : "var(--surface)",
          border: `1px solid ${hasFilter ? "var(--primary)" : "var(--border)"}`,
          color: hasFilter ? "var(--primary)" : "var(--muted)",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
        </svg>
        {hasFilter ? "Filtro ativo" : "Filtrar por período"}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="flex flex-wrap gap-3 items-center justify-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider whitespace-nowrap">De</label>
            <input
              type="date"
              defaultValue={params.get("from") ?? ""}
              onChange={(e) => update("from", e.target.value)}
              className="rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--muted)] uppercase tracking-wider whitespace-nowrap">Até</label>
            <input
              type="date"
              defaultValue={params.get("to") ?? ""}
              onChange={(e) => update("to", e.target.value)}
              className="rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
          {hasFilter && (
            <button onClick={clear} className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors underline underline-offset-2">
              Limpar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
