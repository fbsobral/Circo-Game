"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    if (!res.ok) setError("Erro ao enviar e-mail. Tente novamente.")
    else setSent(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div className="w-full max-w-sm relative">
        <AuthLogo />

        <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #16162e 0%, #111120 100%)", border: "1px solid rgba(201,168,76,0.25)", boxShadow: "0 0 60px rgba(201,168,76,0.07), 0 24px 64px rgba(0,0,0,0.6)" }}>
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)" }} />

          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-5">✉️</div>
              <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: "var(--font-cormorant)" }}>E-mail enviado!</h2>
              <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">Verifique sua caixa de entrada e siga o link para redefinir sua senha. O link expira em 1 hora.</p>
              <Link href="/login" className="text-sm text-[var(--primary)] hover:opacity-80 transition-opacity">← Voltar para o login</Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-cormorant)" }}>Esqueci minha senha</h2>
              <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <Input type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
                <Button type="submit" loading={loading} className="w-full">Enviar link</Button>
              </form>
              <div className="mt-5 text-center">
                <Link href="/login" className="text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors">← Voltar para o login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

function AuthLogo() {
  return (
    <div className="text-center mb-10">
      <h1 className="font-bold" style={{ fontFamily: "var(--font-cormorant)", fontSize: "3rem", lineHeight: 1, background: "linear-gradient(135deg, #a07830 0%, #c9a84c 30%, #f0d080 60%, #c9a84c 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.05em" }}>
        CIRCO
      </h1>
      <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--muted)", letterSpacing: "0.25em" }}>game</p>
    </div>
  )
}
