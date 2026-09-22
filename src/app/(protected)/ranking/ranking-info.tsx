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
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              O ranking mede aproveitamento — não quem acumulou mais estrelas no total.
            </p>

            <div className="rounded-xl px-4 py-3 mb-4 text-sm font-mono text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--primary)" }}>
              pontuação = ★ ganhas ÷ aulas esperadas
            </div>

            {/* Three example breakdowns — same visual as profile breakdown */}
            <div className="space-y-3">
              {([
                {
                  label: "Ana — vai 2× por semana",
                  stars: 50, present: 20, absent: 0, expected: 20,
                  score: "2,5", danger: false,
                },
                {
                  label: "João — vai 1× por semana",
                  stars: 25, present: 10, absent: 0, expected: 10,
                  score: "2,5", danger: false,
                },
                {
                  label: "Bia — vai 2×, mas faltou 3×",
                  stars: 20, present: 17, absent: 3, expected: 20,
                  score: "1,0", danger: true,
                },
              ] as const).map(({ label, stars, present, absent, expected, score, danger }) => (
                <div
                  key={label}
                  className="rounded-2xl px-4 py-3 text-sm space-y-1"
                  style={{
                    background: danger ? "rgba(220,38,38,0.06)" : "rgba(201,168,76,0.06)",
                    border: `1px solid ${danger ? "rgba(220,38,38,0.25)" : "rgba(201,168,76,0.18)"}`,
                  }}
                >
                  <div className="text-xs font-semibold mb-2" style={{ color: danger ? "#f87171" : "var(--primary)" }}>
                    {label}
                  </div>
                  <div className="flex justify-between gap-2">
                    <span style={{ color: "var(--muted)" }}>Estrelas ganhas</span>
                    <span className="font-medium" style={{ color: "var(--star-active)" }}>{stars} ★</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span style={{ color: "var(--muted)" }}>Aulas presentes</span>
                    <span className="font-medium">{present}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span style={{ color: "var(--muted)" }}>Faltas registradas</span>
                    <span className="font-medium" style={{ color: absent > 0 ? "#f87171" : undefined }}>{absent}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span style={{ color: "var(--muted)" }}>Total de aulas esperadas</span>
                    <span className="font-medium">{expected}</span>
                  </div>
                  <div
                    className="flex justify-between gap-2 pt-2 mt-1 font-semibold border-t"
                    style={{ borderColor: danger ? "rgba(220,38,38,0.2)" : "rgba(201,168,76,0.2)" }}
                  >
                    <span>Pontuação ({stars} ÷ {expected})</span>
                    <span style={{ color: danger ? "#f87171" : "var(--primary)" }}>{score} ★</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] mt-3 text-center" style={{ color: "var(--muted)" }}>
              Ana e João empatam em 2,5 — frequências diferentes, mesmo aproveitamento · máx. 3,0
            </p>
          </div>
        </div>
      )}
    </>
  )
}
