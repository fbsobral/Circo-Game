"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [tab, setTab] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const errorMsg = params.get("error")

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (tab === "register") {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Erro ao criar conta")
        setLoading(false)
        return
      }
    }

    const result = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError("E-mail ou senha incorretos")
    } else {
      router.push("/feed")
      router.refresh()
    }
  }

  return (
    <div
      className="rounded-2xl p-8 relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #16162e 0%, #111120 100%)",
        border: "1px solid rgba(201,168,76,0.25)",
        boxShadow: "0 0 60px rgba(201,168,76,0.07), 0 24px 64px rgba(0,0,0,0.6)",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)" }} />

      {/* Google */}
      <button
        onClick={() => signIn("google", { callbackUrl: "/feed" })}
        className="flex items-center justify-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 hover:opacity-90 mb-5"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "var(--text)",
        }}
      >
        <GoogleIcon />
        Continuar com Google
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <span className="text-xs text-[var(--muted)] uppercase tracking-widest">ou</span>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl p-1 mb-5" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)" }}>
        {(["login", "register"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError("") }}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: tab === t ? "var(--surface-2)" : "transparent",
              color: tab === t ? "var(--text)" : "var(--muted)",
              boxShadow: tab === t ? "0 2px 8px rgba(0,0,0,0.3)" : undefined,
            }}
          >
            {t === "login" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      <form onSubmit={handleCredentials} className="flex flex-col gap-3">
        {tab === "register" && (
          <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />

        {(error || errorMsg) && (
          <p className="text-xs text-[var(--danger)]">{error || "Erro de autenticação"}</p>
        )}

        <Button type="submit" loading={loading} className="w-full mt-1">
          {tab === "login" ? "Entrar" : "Criar conta"}
        </Button>
      </form>

      {tab === "login" && (
        <div className="mt-5 text-center">
          <Link href="/forgot-password" className="text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
            Esqueci minha senha
          </Link>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Atmospheric glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{
          position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", right: "-10%",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(100,80,200,0.05) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1
            className="font-bold mb-2"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "3rem",
              lineHeight: 1,
              background: "linear-gradient(135deg, #a07830 0%, #c9a84c 30%, #f0d080 60%, #c9a84c 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "0.05em",
            }}
          >
            CIRCO
          </h1>
          <p className="text-sm tracking-widest uppercase" style={{ color: "var(--muted)", letterSpacing: "0.25em" }}>
            game
          </p>
        </div>

        <Suspense fallback={<div className="rounded-2xl p-8 h-96 animate-pulse" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
