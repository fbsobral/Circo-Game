import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { AdminUsersClient } from "./admin-users-client"

export default async function AdminPage() {
  const session = await auth()
  const role = (session!.user as { role: string }).role
  if (role !== "admin") redirect("/dashboard")

  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, image: true, createdAt: true, mustChangePassword: true, weeklyFrequency: true },
    orderBy: { createdAt: "asc" },
  })

  const stats = await db.$transaction([
    db.user.count(),
    db.class.count(),
    db.starRecord.aggregate({ _sum: { stars: true } }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-cormorant)" }}>
          Painel Admin
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 text-center">
          <div className="text-3xl font-bold text-[var(--primary)]" style={{ fontFamily: "var(--font-cormorant)" }}>{stats[0]}</div>
          <div className="text-xs text-[var(--muted)] mt-1">Usuários</div>
        </div>
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 text-center">
          <div className="text-3xl font-bold text-[var(--primary)]" style={{ fontFamily: "var(--font-cormorant)" }}>{stats[1]}</div>
          <div className="text-xs text-[var(--muted)] mt-1">Aulas</div>
        </div>
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 text-center">
          <div className="text-3xl font-bold text-[var(--star-active)]" style={{ fontFamily: "var(--font-cormorant)" }}>{stats[2]._sum.stars ?? 0}</div>
          <div className="text-xs text-[var(--muted)] mt-1">Estrelas distribuídas</div>
        </div>
      </div>

      <AdminUsersClient users={users} currentUserId={session!.user.id} />
    </div>
  )
}
