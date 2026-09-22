"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  body: string
  url: string | null
  read: boolean
  createdAt: string
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function typeIcon(type: string) {
  if (type === "stars") return "★"
  if (type === "broadcast") return "📢"
  return "@"
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications")
    if (!res.ok) return
    const data = await res.json()
    setNotifications(data.notifications)
    setUnreadCount(data.unreadCount)
  }, [])

  useEffect(() => { load() }, [load])

  // Poll every 30s for new notifications
  useEffect(() => {
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  async function handleOpen() {
    setOpen((o) => !o)
    if (!open && unreadCount > 0) {
      // Mark visible notifications as read
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
      if (unreadIds.length) {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: unreadIds }),
        })
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 hover:bg-[var(--surface-2)]"
        style={{ color: open ? "var(--primary)" : "var(--muted)" }}
        aria-label="Notificações"
      >
        <IconBell />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: "var(--primary)", color: "#1a1200" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden shadow-2xl z-50"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-semibold">Notificações</span>
            <Link
              href="/notificacoes"
              onClick={() => setOpen(false)}
              className="text-xs transition-colors hover:text-[var(--text)]"
              style={{ color: "var(--primary)" }}
            >
              ver todas
            </Link>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--border)", maxHeight: 360, overflowY: "auto" }}>
            {notifications.length === 0 && (
              <div className="py-10 text-center text-sm" style={{ color: "var(--muted)" }}>
                Sem notificações
              </div>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                className="px-4 py-3 flex gap-3 transition-colors hover:bg-[var(--surface-2)]"
                style={{ background: n.read ? undefined : "rgba(201,168,76,0.04)" }}
              >
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm"
                  style={{
                    background: n.type === "stars" ? "rgba(201,168,76,0.15)" : n.type === "broadcast" ? "rgba(140,100,220,0.15)" : "rgba(100,160,220,0.15)",
                    color: n.type === "stars" ? "var(--star-active)" : n.type === "broadcast" ? "#a78bfa" : "#60a5fa",
                  }}
                >
                  {typeIcon(n.type)}
                </span>
                <div className="flex-1 min-w-0">
                  {n.url ? (
                    <Link href={n.url} onClick={() => setOpen(false)} className="block">
                      <div className="text-xs font-semibold leading-snug" style={{ color: n.read ? "var(--muted)" : "var(--text)" }}>{n.title}</div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>{n.body}</div>
                    </Link>
                  ) : (
                    <>
                      <div className="text-xs font-semibold leading-snug" style={{ color: n.read ? "var(--muted)" : "var(--text)" }}>{n.title}</div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>{n.body}</div>
                    </>
                  )}
                  <div className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>
                    {formatDate(new Date(n.createdAt))}
                  </div>
                </div>
                {!n.read && (
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: "var(--primary)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
