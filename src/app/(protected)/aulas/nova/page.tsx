import { db } from "@/lib/db"
import { NovaAulaForm } from "./nova-aula-form"

export default async function NovaAulaPage() {
  const users = await db.user.findMany({
    where: { role: "student" },
    select: { id: true, name: true, image: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-cormorant)" }}>
          Registrar aula
        </h1>
      </div>
      <NovaAulaForm users={users} />
    </div>
  )
}
