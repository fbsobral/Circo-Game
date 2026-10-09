"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ClassReviewForm({ classId, initialStars, initialComment }: {
  classId: string
  initialStars: number
  initialComment: string
}) {
  const router = useRouter()
  const [stars, setStars] = useState(initialStars)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState(initialComment)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(initialStars > 0)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!stars) { setError("Escolha de 1 a 5 estrelas"); return }
    setLoading(true)
    setError("")
    const res = await fetch(`/api/classes/${classId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars, comment }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Não foi possível enviar. Tente novamente.")
      return
    }
    setSaved(true)
    router.refresh()
  }

  const shown = hover || stars

  return (
    <form
      onSubmit={submit}
      className="rounded-xl p-5 space-y-3"
      style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.18)" }}
    >
      <div>
        <h2 className="text-base font-semibold" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.25rem" }}>
          {saved ? "Sua avaliação desta aula" : "Avalie esta aula"}
        </h2>
        <p className="text-xs text-[var(--muted)] mt-0.5">O feedback vai para o professor e não afeta o ranking.</p>
      </div>

      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
            className="text-3xl leading-none transition-transform hover:scale-110"
            style={{ color: n <= shown ? "var(--star-active)" : "var(--border-bright, #444466)" }}
          >
            ★
          </button>
        ))}
        {stars > 0 && <span className="ml-2 text-sm text-[var(--muted)]">{stars} de 5</span>}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Conte o que achou da aula, o que funcionou e o que pode melhorar (opcional)"
        className="w-full rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--primary)] transition-colors"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "16px" }}
      />

      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" size="sm" loading={loading}>{saved ? "Atualizar avaliação" : "Enviar avaliação"}</Button>
      </div>
    </form>
  )
}
