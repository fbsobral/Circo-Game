"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Role = "admin" | "professor" | "student"

interface User {
  id: string
  name: string | null
  email: string | null
  role: Role
  image: string | null
  createdAt: Date
}

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  professor: "Professor",
  student: "Aluno",
}

const roleOrder: Role[] = ["student", "professor", "admin"]

const emptyForm = { name: "", email: "", userRole: "student" as Role }

export function AdminUsersClient({ users: initial, currentUserId, isProfessor = false }: { users: User[]; currentUserId: string; isProfessor?: boolean }) {
  const router = useRouter()
  const [users, setUsers] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", email: "" })
  const [editError, setEditError] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError("")
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setFormLoading(false)
    if (!res.ok) {
      setFormError(data.error ?? "Erro ao criar usuário")
      return
    }
    setUsers((prev) => [...prev, data])
    setForm(emptyForm)
    setShowForm(false)
  }

  function startEdit(user: User) {
    setEditingId(user.id)
    setEditForm({ name: user.name ?? "", email: user.email ?? "" })
    setEditError("")
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setEditLoading(true)
    setEditError("")
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit", userId: editingId, ...editForm }),
    })
    const data = await res.json()
    setEditLoading(false)
    if (!res.ok) {
      setEditError(data.error ?? "Erro ao salvar")
      return
    }
    setUsers((prev) => prev.map((u) => (u.id === editingId ? { ...u, ...data } : u)))
    setEditingId(null)
  }

  async function changeRole(userId: string, newRole: Role) {
    setLoading(userId + newRole)
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newRole }),
    })
    if (res.ok) {
      const updated = await res.json()
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)))
    }
    setLoading(null)
  }

  async function removeUser(userId: string) {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return
    setLoading(userId + "delete")
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    setUsers((prev) => prev.filter((u) => u.id !== userId))
    setLoading(null)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Usuários ({users.length})</h2>
        <Button size="sm" onClick={() => { setShowForm((v) => !v); setFormError("") }}>
          {showForm ? "Cancelar" : "+ Novo usuário"}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createUser} className="rounded-xl bg-[var(--surface)] border border-[var(--primary)]/40 p-5 mb-4 space-y-3">
          <h3 className="text-base font-semibold text-[var(--primary)] mb-1">Novo usuário</h3>
          <p className="text-sm text-[var(--muted)]">Uma senha temporária será gerada e enviada por e-mail.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Nome completo"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              type="email"
              placeholder="E-mail"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <select
              value={form.userRole}
              onChange={(e) => setForm((f) => ({ ...f, userRole: e.target.value as Role }))}
              className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            >
              <option value="student">Aluno</option>
              <option value="professor">Professor</option>
              {!isProfessor && <option value="admin">Admin</option>}
            </select>
          </div>
          {formError && <p className="text-xs text-[var(--danger)]">{formError}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={formLoading} size="sm">Criar usuário</Button>
          </div>
        </form>
      )}

      {/* Users list */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] divide-y divide-[var(--border)]">
        {users.map((user) => {
          const isMe = user.id === currentUserId
          const currentRoleIdx = roleOrder.indexOf(user.role)
          const isEditing = editingId === user.id

          return (
            <div key={user.id}>
              <div className="flex items-center gap-3 px-4 py-3.5 flex-wrap">
                <Avatar name={user.name} image={user.image} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="user-name text-sm font-medium truncate">{user.name}</span>
                    {isMe && <span className="text-[10px] text-[var(--primary)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">você</span>}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      user.role === "admin" ? "bg-[var(--primary)]/20 text-[var(--primary)]" :
                      user.role === "professor" ? "bg-blue-900/40 text-blue-300" :
                      "bg-[var(--surface-2)] text-[var(--muted)]"
                    }`}>
                      {roleLabels[user.role]}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--muted)]">{user.email}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => isEditing ? setEditingId(null) : startEdit(user)}
                  >
                    {isEditing ? "✕" : "✎"}
                  </Button>
                  {!isMe && !isProfessor && (
                    <>
                      {currentRoleIdx > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={loading === user.id + roleOrder[currentRoleIdx - 1]}
                          onClick={() => changeRole(user.id, roleOrder[currentRoleIdx - 1])}
                          title={`Rebaixar para ${roleLabels[roleOrder[currentRoleIdx - 1]]}`}
                        >
                          ↓
                        </Button>
                      )}
                      {currentRoleIdx < roleOrder.length - 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={loading === user.id + roleOrder[currentRoleIdx + 1]}
                          onClick={() => changeRole(user.id, roleOrder[currentRoleIdx + 1])}
                          title={`Promover para ${roleLabels[roleOrder[currentRoleIdx + 1]]}`}
                        >
                          ↑
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        loading={loading === user.id + "delete"}
                        onClick={() => removeUser(user.id)}
                      >
                        <span className="hidden sm:inline">Remover</span>
                        <span className="sm:hidden">✕</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing && (
                <form onSubmit={saveEdit} className="px-5 pb-4 space-y-2 bg-[var(--surface-2)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <Input
                      placeholder="Nome"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                    <Input
                      type="email"
                      placeholder="E-mail"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                  {editError && <p className="text-xs text-[var(--danger)]">{editError}</p>}
                  <div className="flex justify-end">
                    <Button type="submit" loading={editLoading} size="sm">Salvar</Button>
                  </div>
                </form>
              )}
            </div>
          )
        })}
        {users.length === 0 && (
          <div className="py-12 text-center text-sm text-[var(--muted)]">Nenhum usuário ainda</div>
        )}
      </div>
    </div>
  )
}
