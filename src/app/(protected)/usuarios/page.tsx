import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { AdminUsersClient } from "../admin/admin-users-client"

export default async function UsuariosPage() {
  const session = await auth()
  const role = (session!.user as { role: string }).role
  if (role !== "professor" && role !== "admin") redirect("/dashboard")

  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, image: true, createdAt: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-cormorant)" }}>
          Usuários
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">Gerencie alunos e professores</p>
      </div>

      <AdminUsersClient
        users={users}
        currentUserId={session!.user.id}
        isProfessor={role === "professor"}
      />
    </div>
  )
}
