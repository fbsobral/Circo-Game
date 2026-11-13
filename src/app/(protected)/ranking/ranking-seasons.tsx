"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

interface SeasonOption {
  id: string
  name: string
  active: boolean
}

export function RankingSeasons({ seasons, selected }: { seasons: SeasonOption[]; selected: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function select(value: string) {
    startTransition(() => router.push(value === "period" ? "/ranking" : `/ranking?season=${value}`))
  }

  return (
    <select
      value={selected}
      onChange={(e) => select(e.target.value)}
      disabled={pending}
      aria-label="Período do ranking"
      className="rounded-full px-4 py-1.5 text-xs font-medium focus:outline-none focus:border-[var(--primary)] transition-colors disabled:opacity-60"
      style={{ background: "var(--surface)", border: "1px solid var(--primary)", color: "var(--primary)" }}
    >
      {seasons.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}{s.active ? " (ativo)" : ""}
        </option>
      ))}
      <option value="all">Geral (todas as aulas)</option>
      {selected === "period" && <option value="period">Período personalizado</option>}
    </select>
  )
}
