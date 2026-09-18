"use client"

import { useState, useRef } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let w = img.width, h = img.height
        if (w > 400) { h = Math.round(h * 400 / w); w = 400 }
        const canvas = document.createElement("canvas")
        canvas.width = w; canvas.height = h
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/jpeg", 0.8))
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

interface User { id: string; name: string | null; email: string; image: string | null; hasPassword: boolean }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>{title}</h2>
      {children}
    </div>
  )
}

export function ContaClient({ user, googleLinked }: { user: User; googleLinked: boolean }) {
  const { update } = useSession()
  const fileRef = useRef<HTMLInputElement>(null)

  const [avatar, setAvatar] = useState(user.image)
  const [avatarLoading, setAvatarLoading] = useState(false)

  const [name, setName] = useState(user.name ?? "")
  const [nameLoading, setNameLoading] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [current, setCurrent] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleLinkedState, setGoogleLinkedState] = useState(googleLinked)
  const [googleMsg, setGoogleMsg] = useState("")

  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleName(e: React.FormEvent) {
    e.preventDefault()
    setNameLoading(true)
    setNameMsg(null)
    const res = await fetch("/api/conta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    setNameLoading(false)
    if (res.ok) {
      setNameMsg({ ok: true, text: "Nome atualizado!" })
      await update()
    } else {
      const data = await res.json()
      setNameMsg({ ok: false, text: data.error })
    }
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    const compressed = await compressImage(file)
    const res = await fetch("/api/conta/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: compressed }),
    })
    if (res.ok) { setAvatar(compressed); await update() }
    setAvatarLoading(false)
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPwd !== confirmPwd) { setPwdMsg({ ok: false, text: "As senhas não coincidem" }); return }
    setPwdLoading(true)
    setPwdMsg(null)
    const res = await fetch("/api/conta/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next: newPwd }),
    })
    const data = await res.json()
    setPwdLoading(false)
    if (res.ok) {
      setPwdMsg({ ok: true, text: "Senha atualizada com sucesso!" })
      setCurrent(""); setNewPwd(""); setConfirmPwd("")
    } else {
      setPwdMsg({ ok: false, text: data.error })
    }
  }

  async function handleUnlinkGoogle() {
    if (!confirm("Desvincular sua conta Google?")) return
    setGoogleLoading(true)
    const res = await fetch("/api/conta/google", { method: "DELETE" })
    const data = await res.json()
    setGoogleLoading(false)
    if (res.ok) { setGoogleLinkedState(false); setGoogleMsg("Google desvinculado.") }
    else setGoogleMsg(data.error)
  }

  async function handleDelete() {
    if (!confirm("Tem certeza? Esta ação é irreversível e apagará todos os seus dados.")) return
    if (!confirm("Confirmar exclusão permanente da conta?")) return
    setDeleteLoading(true)
    await fetch("/api/conta", { method: "DELETE" })
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-4xl font-bold"
          style={{
            fontFamily: "var(--font-cormorant)",
            background: "linear-gradient(135deg, #c9a84c 0%, #f0c878 50%, #c9a84c 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Minha Conta
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">{user.email}</p>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left col */}
        <div className="space-y-6">
          {/* Avatar */}
          <Section title="Foto de perfil">
            <div className="flex items-center gap-5">
              <Avatar name={name || user.name} image={avatar} size="lg" />
              <div className="space-y-2">
                <Button size="sm" variant="outline" loading={avatarLoading} onClick={() => fileRef.current?.click()}>
                  Alterar foto
                </Button>
                <p className="text-xs text-[var(--muted)]">JPG ou PNG · max 5MB</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
            </div>
          </Section>

          {/* Name */}
          <Section title="Nome">
            <form onSubmit={handleName} className="space-y-3">
              <Input
                placeholder="Seu nome"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameMsg(null) }}
                required
              />
              {nameMsg && (
                <p className="text-sm" style={{ color: nameMsg.ok ? "var(--primary)" : "var(--danger, #e05c7a)" }}>
                  {nameMsg.text}
                </p>
              )}
              <Button type="submit" size="sm" loading={nameLoading} disabled={!name.trim() || name.trim() === (user.name ?? "")}>
                Salvar nome
              </Button>
            </form>
          </Section>

          {/* Google */}
          <Section title="Contas vinculadas">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <div>
                  <p className="text-sm font-medium">Google</p>
                  <p className="text-xs text-[var(--muted)]">{googleLinkedState ? "Vinculado" : "Não vinculado"}</p>
                </div>
              </div>
              {googleLinkedState ? (
                <Button size="sm" variant="outline" loading={googleLoading} onClick={handleUnlinkGoogle}>
                  Desvincular
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => signIn("google", { callbackUrl: "/conta" })}>
                  Vincular
                </Button>
              )}
            </div>
            {googleMsg && <p className="text-xs text-[var(--muted)] mt-2">{googleMsg}</p>}
          </Section>

          {/* Danger zone */}
          <Section title="Zona de perigo">
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted)]">Apagar permanentemente sua conta e todos os seus dados. Esta ação não pode ser desfeita.</p>
              <Button
                variant="outline"
                loading={deleteLoading}
                onClick={handleDelete}
                className="border-[var(--danger,#e05c7a)] text-[var(--danger,#e05c7a)] hover:bg-[rgba(224,92,122,0.08)]"
              >
                Excluir minha conta
              </Button>
            </div>
          </Section>
        </div>

        {/* Right col — Password */}
        <Section title="Alterar senha">
          <form onSubmit={handlePassword} className="space-y-3">
            {user.hasPassword && (
              <Input
                type="password"
                placeholder="Senha atual"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            )}
            <Input
              type="password"
              placeholder="Nova senha (mín. 8 caracteres)"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              required
              minLength={8}
            />
            <Input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
            />
            {pwdMsg && (
              <p className="text-sm" style={{ color: pwdMsg.ok ? "var(--primary)" : "var(--danger, #e05c7a)" }}>
                {pwdMsg.text}
              </p>
            )}
            <Button type="submit" loading={pwdLoading} disabled={!newPwd || !confirmPwd}>
              Salvar senha
            </Button>
          </form>
        </Section>
      </div>
    </div>
  )
}
