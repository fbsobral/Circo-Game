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
              O ranking é justo para quem vai 1× ou 2× por semana.
            </p>

            <div className="rounded-xl px-4 py-3 mb-5 text-sm font-mono text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--primary)" }}>
              pontuação = ★ ganhas ÷ aulas esperadas
            </div>

            <div className="space-y-3 text-sm" style={{ color: "var(--muted-foreground, var(--muted))" }}>
              <p>
                <strong style={{ color: "var(--text)" }}>Aulas esperadas</strong> é a frequência semanal do aluno multiplicada pelo número de semanas desde que ele entrou no app.
              </p>
              <p>
                Assim, quem vai <strong style={{ color: "var(--text)" }}>1× por semana</strong> e quem vai <strong style={{ color: "var(--text)" }}>2× por semana</strong> competem em igualdade — o que conta é o aproveitamento, não a quantidade de aulas.
              </p>
              <p>
                <strong style={{ color: "var(--text)" }}>Quem falta perde posição</strong>: as aulas esperadas continuam crescendo semana a semana, mas as estrelas ficam paradas.
              </p>
            </div>

            {/* Example table */}
            <div className="mt-5 rounded-xl overflow-hidden text-xs" style={{ border: "1px solid var(--border)" }}>
              <div className="grid grid-cols-4 px-3 py-2 font-semibold" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                <span>Aluno</span>
                <span className="text-center">Freq.</span>
                <span className="text-center">★ ganhas</span>
                <span className="text-center" style={{ color: "var(--primary)" }}>Pontuação</span>
              </div>
              {[
                { name: "Ana", freq: "2×", stars: 90, score: "4,5" },
                { name: "João", freq: "1×", stars: 45, score: "4,5" },
                { name: "Bia (faltou)", freq: "2×", stars: 40, score: "2,0" },
              ].map((row) => (
                <div key={row.name} className="grid grid-cols-4 px-3 py-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <span style={{ color: "var(--text)" }}>{row.name}</span>
                  <span className="text-center">{row.freq}</span>
                  <span className="text-center">{row.stars}★</span>
                  <span className="text-center font-bold" style={{ color: "var(--primary)" }}>{row.score}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] mt-2 text-center" style={{ color: "var(--muted)" }}>
              Ana e João empatam mesmo que Ana tenha 2× mais estrelas no total.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
