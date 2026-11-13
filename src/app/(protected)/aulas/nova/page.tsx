import { db } from "@/lib/db"
import { NovaAulaForm } from "./nova-aula-form"
import { birthMonthDay } from "@/lib/birthday-match"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Nova aula" }


export default async function NovaAulaPage() {
  const users = await db.user.findMany({
    where: { role: { in: ["student", "admin"] } },
    select: { id: true, name: true, image: true, birthDate: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-cormorant)" }}>
          Registrar aula
        </h1>
      </div>
      <NovaAulaForm users={users.map(({ birthDate, ...u }) => ({ ...u, birthday: birthDate ? birthMonthDay(birthDate) : null }))} />
    </div>
  )
}
