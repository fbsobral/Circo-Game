"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function DeleteClassButton({ classId, isCreator }: { classId: string; isCreator: boolean }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isCreator) return null

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/classes/${classId}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/aulas")
      router.refresh()
    } else {
      const { error } = await res.json()
      alert(error ?? "Erro ao apagar aula")
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Apagar mesmo?</span>
        <Button size="sm" variant="danger" disabled={loading} onClick={handleDelete}>
          {loading ? "Apagando…" : "Sim, apagar"}
        </Button>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <Button size="sm" variant="outline" onClick={() => setConfirming(true)}
      style={{ color: "var(--destructive)", borderColor: "var(--destructive)" }}>
      Apagar aula
    </Button>
  )
}
