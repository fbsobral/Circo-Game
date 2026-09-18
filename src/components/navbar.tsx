"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

interface NavbarProps {
  role: string
  name?: string | null
}

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}

function IconAulas() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function IconSignOut() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

const Logo = () => (
  <Link href="/ranking" className="flex items-center gap-2">
    <span
      className="text-2xl font-bold tracking-widest"
      style={{
        fontFamily: "var(--font-cormorant)",
        background: "linear-gradient(135deg, #c9a84c 0%, #f0c878 50%, #c9a84c 100%)",
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        textTransform: "uppercase",
      }}
    >
      CIRCO
    </span>
    <span
      className="text-base font-light tracking-widest"
      style={{ fontFamily: "var(--font-inter, sans-serif)", color: "#7c5cbf", letterSpacing: "0.22em", textTransform: "uppercase" }}
    >
      GAME
    </span>
  </Link>
)

export function Navbar({ role, name }: NavbarProps) {
  const pathname = usePathname()
  const isProfOrAdmin = role === "professor" || role === "admin"

  const links = [
    { href: "/ranking", label: "Início", icon: <IconHome /> },
    { href: "/aulas", label: "Aulas", icon: <IconAulas /> },
    ...(isProfOrAdmin ? [{ href: "/usuarios", label: "Usuários", icon: <IconUsers /> }] : []),
  ]

  const isActive = (href: string) =>
    pathname === href || (href !== "/ranking" && pathname.startsWith(href))

  return (
    <>
      {/* ── Desktop top nav ── */}
      <header
        className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md hidden md:block"
        style={{ boxShadow: "0 1px 0 0 rgba(201,168,76,0.08), 0 4px 24px -4px rgba(0,0,0,0.6)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Logo />

          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm transition-all duration-150 relative",
                  isActive(l.href) ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--text)]",
                )}
              >
                {isActive(l.href) && <span className="absolute inset-0 rounded-lg bg-[var(--primary-dim)]" />}
                <span className="relative">{l.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isProfOrAdmin && (
              <Link
                href="/aulas/nova"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-95"
                style={{ background: "linear-gradient(135deg, #c9a84c 0%, #f0c878 100%)", color: "#1a1200" }}
              >
                + Registrar aula
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm transition-all duration-150 hover:bg-[rgba(140,100,220,0.1)]"
              style={{ border: "1px solid rgba(140,100,220,0.4)", color: "rgba(180,140,255,0.8)" }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile: slim top brand bar ── */}
      <header
        className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md"
        style={{ boxShadow: "0 1px 0 0 rgba(201,168,76,0.08)" }}
      >
        <Logo />
        {isProfOrAdmin && (
          <Link
            href="/aulas/nova"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #c9a84c 0%, #f0c878 100%)", color: "#1a1200" }}
          >
            <IconPlus />
          </Link>
        )}
      </header>

      {/* ── Mobile: bottom tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center border-t border-[var(--border)]"
        style={{
          background: "rgba(8,8,16,0.96)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 -1px 0 rgba(201,168,76,0.08), 0 -8px 32px rgba(0,0,0,0.6)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-150 active:scale-95"
            style={{ color: isActive(l.href) ? "var(--primary)" : "var(--muted)" }}
          >
            {l.icon}
            <span className="text-[10px] font-medium tracking-wide">{l.label}</span>
            {isActive(l.href) && (
              <span className="absolute bottom-0 w-8 h-0.5 rounded-t-full" style={{ background: "var(--primary)" }} />
            )}
          </Link>
        ))}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-150 active:scale-95"
          style={{ color: "var(--muted)" }}
        >
          <IconSignOut />
          <span className="text-[10px] font-medium tracking-wide">Sair</span>
        </button>
      </nav>
    </>
  )
}
