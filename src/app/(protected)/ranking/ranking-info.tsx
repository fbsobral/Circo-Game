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

            <div className="rounded-xl px-4 py-3 mb-5 text-sm font-mono text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--primary)" }}>
              pontuação = ★ ganhas ÷ aulas esperadas
            </div>

            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
              <strong style={{ color: "var(--text)" }}>Aulas esperadas</strong> = todas as aulas em que o professor te marcou (presente, zero estrelas ou falta). Quem falta entra no denominador sem ganhar estrelas — a média cai.
            </p>

            {/* Three example breakdowns */}
            <div className="space-y-3">
              {[
                { name: "Ana (2× por semana)", rows: [["Estrelas ganhas", "50 ★", false], ["Aulas esperadas", "20", false], ["Pontuação (50 ÷ 20)", "2,5 ★", true]] },
                { name: "João (1× por semana)", rows: [["Estrelas ganhas", "25 ★", false], ["Aulas esperadas", "10", false], ["Pontuação (25 ÷ 10)", "2,5 ★", true]] },
                { name: "Bia (3 faltas)", rows: [["Estrelas ganhas", "20 ★", false], ["Aulas esperadas", "20", false], ["Pontuação (20 ÷ 20)", "1,0 ★", true]], danger: true },
              ].map(({ name, rows, danger }) => (
                <div key={name} className="rounded-xl overflow-hidden text-xs" style={{ border: `1px solid ${danger ? "rgba(220,38,38,0.3)" : "var(--border)"}`, background: danger ? "rgba(220,38,38,0.04)" : undefined }}>
                  <div className="px-3 py-2 font-semibold" style={{ background: "var(--surface-2)", color: danger ? "#f87171" : "var(--text)" }}>{name}</div>
                  {rows.map(([label, value, isFinal]) => (
                    <div key={String(label)} className="flex justify-between px-3 py-1.5 border-t" style={{ borderColor: danger ? "rgba(220,38,38,0.2)" : "var(--border)", fontWeight: isFinal ? 600 : undefined }}>
                      <span style={{ color: "var(--muted)" }}>{label}</span>
                      <span style={{ color: isFinal ? (danger ? "#f87171" : "var(--primary)") : "var(--text)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-[11px] mt-3 text-center" style={{ color: "var(--muted)" }}>
              Ana e João empatam em 2,5 mesmo com frequências diferentes · máx. possível: 3,0
            </p>
          </div>
        </div>
      )}
    </>
  )
}
