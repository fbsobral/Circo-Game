import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { listSeasons, seasonStatus, toDateInput } from "@/lib/seasons"
import { PeriodsClient } from "./periods-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Períodos do ranking" }

export default async function PeriodosPage() {
  const session = await auth()
  const role = (session!.user as { role: string }).role
  if (role !== "professor" && role !== "admin") redirect("/ranking")

  const seasons = (await listSeasons()).map((s) => ({
    id: s.id,
    name: s.name,
    startDate: toDateInput(s.startDate),
    endDate: toDateInput(s.endDate),
    status: seasonStatus(s),
    active: s.active,
  }))

  return (
    <div className="space-y-6">
      <div>
        <Link href="/ranking" className="text-xs text-[var(--muted)] hover:text-[var(--text)]">← Ranking</Link>
        <h1 className="text-3xl font-bold mt-1" style={{ fontFamily: "var(--font-cormorant)" }}>
          Períodos do ranking
        </h1>
      </div>
      <PeriodsClient seasons={seasons} />
    </div>
  )
}
