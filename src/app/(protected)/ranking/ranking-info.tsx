"use client"

import { useState, useEffect, useRef } from "react"

export function RankingInfo() {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors hover:bg-[var(--surface-2)] flex-shrink-0"
        style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
        title="Como funciona a pontuação?"
        aria-label="Como funciona a pontuação?"
      >
        ?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div
            ref={dialogRef}
            className="rounded-2xl p-6 w-full relative"
            style={{
              maxWidth: 420,
              background: "linear-gradient(160deg, #16162e 0%, #111120 100%)",
              border: "1px solid rgba(201,168,76,0.3)",
              boxShadow: "0 0 60px rgba(201,168,76,0.08), 0 24px 64px rgba(0,0,0,0.7)",
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
              style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)" }}
            />

            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-colors hover:bg-[var(--surface-2)]"
              style={{ color: "var(--muted)" }}
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-cormorant)", color: "var(--primary)" }}>
              Como funciona a pontuação?
            </h2>
            <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
              O ranking mede aproveitamento — não quem acumulou mais estrelas no total.
            </p>

            <div className="rounded-xl px-4 py-3 mb-5 text-sm font-mono text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--primary)" }}>
              pontuação = ★ ganhas ÷ aulas esperadas
            </div>

            <div className="space-y-3 text-sm" style={{ color: "var(--muted-foreground, var(--muted))" }}>
              <p>
                <strong style={{ color: "var(--text)" }}>Aulas esperadas</strong> = todas as aulas em que você foi marcado pelo professor — seja com estrelas, com zero, ou como falta.
              </p>
              <p>
                Quem vai <strong style={{ color: "var(--text)" }}>2× por semana</strong> tem mais aulas esperadas, então precisa de mais estrelas para ter a mesma pontuação de quem vai <strong style={{ color: "var(--text)" }}>1× por semana</strong>. Justo para os dois.
              </p>
              <p>
                <strong style={{ color: "var(--text)" }}>Falta conta contra você</strong>: entra nas aulas esperadas sem contribuir com estrelas — derruba a média.
              </p>
            </div>

            {/* Example table */}
            <div className="mt-5 rounded-xl overflow-hidden text-xs" style={{ border: "1px solid var(--border)" }}>
              <div className="grid grid-cols-4 px-3 py-2 font-semibold" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                <span>Aluno</span>
                <span className="text-center">Esperadas</span>
                <span className="text-center">★ ganhas</span>
                <span className="text-center" style={{ color: "var(--primary)" }}>Pontuação</span>
              </div>
              {[
                { name: "Ana", expected: 20, stars: 50, score: "2,5" },
                { name: "João", expected: 10, stars: 25, score: "2,5" },
                { name: "Bia (3 faltas)", expected: 20, stars: 20, score: "1,0" },
              ].map((row) => (
                <div key={row.name} className="grid grid-cols-4 px-3 py-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <span style={{ color: "var(--text)" }}>{row.name}</span>
                  <span className="text-center">{row.expected}</span>
                  <span className="text-center">{row.stars}★</span>
                  <span className="text-center font-bold" style={{ color: "var(--primary)" }}>{row.score}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] mt-2 text-center" style={{ color: "var(--muted)" }}>
              Ana e João empatam: Ana foi 20× e ganhou 90★ · João foi 10× e ganhou 45★.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
