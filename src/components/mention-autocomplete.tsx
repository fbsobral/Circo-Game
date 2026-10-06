"use client"

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Avatar } from "@/components/ui/avatar"

export interface MentionUser { id: string; name: string | null; image: string | null }

export function useMentionUsers() {
  const [users, setUsers] = useState<MentionUser[]>([])
  const loaded = useRef(false)
  const load = useCallback(async () => {
    if (loaded.current) return
    loaded.current = true
    const res = await fetch("/api/users")
    if (res.ok) setUsers(await res.json())
  }, [])
  return { users, load }
}

type Coords = { left: number; top: number; bottom: number }
type MentionItem = { id: string; name: string; image: string | null; todos?: boolean }

export function getCaretCoords(el: HTMLTextAreaElement | HTMLInputElement, pos: number): Coords {
  const cs = getComputedStyle(el)
  const rect = el.getBoundingClientRect()
  const isInput = el instanceof HTMLInputElement
  const mirror = document.createElement("div")
  Object.assign(mirror.style, {
    position: "fixed", top: "0px", left: "-9999px", visibility: "hidden",
    whiteSpace: isInput ? "pre" : "pre-wrap", wordBreak: "break-word",
    width: isInput ? "auto" : rect.width + "px",
    fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontStyle: cs.fontStyle,
    letterSpacing: cs.letterSpacing, lineHeight: cs.lineHeight, textTransform: cs.textTransform,
    padding: cs.padding, border: cs.border, boxSizing: cs.boxSizing,
  })
  mirror.textContent = el.value.slice(0, pos)
  const marker = document.createElement("span")
  marker.textContent = "\u200b"
  mirror.appendChild(marker)
  document.body.appendChild(mirror)
  const m = mirror.getBoundingClientRect()
  const mk = marker.getBoundingClientRect()
  document.body.removeChild(mirror)

  const left = rect.left + (mk.left - m.left) - el.scrollLeft
  if (isInput) return { left, top: rect.top, bottom: rect.bottom }
  const top = rect.top + (mk.top - m.top) - el.scrollTop
  return { left, top, bottom: top + (mk.height || parseFloat(cs.lineHeight) || 20) }
}

const NAV_KEYS = ["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"]

export function useMentionAutocomplete(
  ref: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
  value: string,
  setValue: (v: string) => void,
  users: MentionUser[],
  onFocusMentions: () => void,
) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState(0)
  const [caretCoords, setCaretCoords] = useState<Coords | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const items: MentionItem[] = []
  if (mentionQuery !== null) {
    const q = mentionQuery.toLowerCase()
    if ("todos".includes(q)) items.push({ id: "todos", name: "todos", image: null, todos: true })
    for (const u of users) {
      if (items.length >= 7) break
      if (u.name?.toLowerCase().includes(q)) items.push({ id: u.id, name: u.name, image: u.image })
    }
  }
  const open = mentionQuery !== null && items.length > 0

  useEffect(() => { setActiveIndex(0) }, [mentionQuery])

  const close = useCallback(() => { setMentionQuery(null); setCaretCoords(null) }, [])

  useEffect(() => {
    if (!open) return
    const reposition = () => {
      const el = ref.current
      if (el) setCaretCoords(getCaretCoords(el, mentionStart))
    }
    const onDown = (e: MouseEvent) => {
      const target = e.target as Element
      if (target.closest("[data-mention-dropdown]") || target === ref.current) return
      close()
    }
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)
    document.addEventListener("mousedown", onDown)
    return () => {
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
      document.removeEventListener("mousedown", onDown)
    }
  }, [open, mentionStart, ref, close])

  function onKeyUp(e?: { key: string }) {
    if (e && NAV_KEYS.includes(e.key)) return
    const el = ref.current
    if (!el) return
    const cursor = el.selectionStart ?? 0
    const before = el.value.slice(0, cursor)
    const match = before.match(/@(\w[\w\s]*)$/)
    if (match || before.endsWith("@")) {
      const start = match ? cursor - match[0].length : cursor - 1
      setMentionQuery(match ? match[1] : "")
      setMentionStart(start)
      setCaretCoords(getCaretCoords(el, start))
      onFocusMentions()
    } else {
      close()
    }
  }

  function selectMention(name: string) {
    const el = ref.current
    if (!el) return
    const cursor = el.selectionStart ?? value.length
    const before = value.slice(0, mentionStart)
    const after = value.slice(cursor)
    setValue(`${before}@${name} ${after}`)
    close()
    setTimeout(() => {
      el.focus()
      const pos = mentionStart + name.length + 2
      el.setSelectionRange(pos, pos)
    }, 0)
  }

  function onKeyDown(e: React.KeyboardEvent): boolean {
    if (!open || e.nativeEvent.isComposing) return false
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => (i + 1) % items.length); return true }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => (i - 1 + items.length) % items.length); return true }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      selectMention(items[Math.min(activeIndex, items.length - 1)].name)
      return true
    }
    if (e.key === "Escape") { e.preventDefault(); close(); return true }
    return false
  }

  return { open, items, activeIndex, setActiveIndex, caretCoords, selectMention, onKeyUp, onKeyDown }
}

export type MentionState = ReturnType<typeof useMentionAutocomplete>

export function MentionDropdown({ mention }: { mention: MentionState }) {
  const { open, items, activeIndex, setActiveIndex, caretCoords, selectMention } = mention
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !caretCoords) return
    const vv = window.visualViewport
    const viewTop = vv?.offsetTop ?? 0
    const viewBottom = viewTop + (vv?.height ?? window.innerHeight)
    const viewWidth = vv?.width ?? window.innerWidth
    const h = el.offsetHeight
    const w = el.offsetWidth
    const left = Math.max(8, Math.min(caretCoords.left, viewWidth - w - 8))
    const below = caretCoords.bottom + 4
    const top = below + h > viewBottom - 8 && caretCoords.top - 4 - h > viewTop + 8
      ? caretCoords.top - 4 - h
      : below
    setPos({ top, left })
  }, [caretCoords, items.length])

  if (!open || !caretCoords || typeof document === "undefined") return null

  return createPortal(
    <div
      ref={ref}
      data-mention-dropdown
      className="rounded-xl shadow-xl overflow-hidden"
      style={{
        position: "fixed", zIndex: 1000, minWidth: 200, maxWidth: "calc(100vw - 16px)",
        top: pos?.top ?? caretCoords.bottom + 4, left: pos?.left ?? caretCoords.left,
        visibility: pos ? "visible" : "hidden",
        background: "var(--surface)", border: "1px solid var(--border)",
      }}
    >
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); selectMention(item.name) }}
          onMouseEnter={() => setActiveIndex(i)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
          style={{ background: i === activeIndex ? "var(--surface-2)" : "transparent" }}
        >
          {item.todos ? (
            <>
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: "rgba(140,100,220,0.15)", color: "#a78bfa" }}>📢</span>
              <div>
                <div className="font-semibold" style={{ color: "#a78bfa" }}>@todos</div>
                <div className="text-[11px]" style={{ color: "var(--muted)" }}>Notifica todos os membros</div>
              </div>
            </>
          ) : (
            <>
              <Avatar name={item.name} image={item.image} size="sm" />
              <span>{item.name}</span>
            </>
          )}
        </button>
      ))}
    </div>,
    document.body,
  )
}

export function highlightMentions(text: string, mentionMap: Record<string, string> = {}, overlay = false) {
  const parts = text.split(/(@todos|@\p{Lu}\S*(?:\s+\p{Lu}\S*)*)/gu)
  return parts.map((part, i) => {
    if (!part.startsWith("@")) return part
    const isBroadcast = part.toLowerCase() === "@todos"
    const color = isBroadcast ? "#a78bfa" : "var(--primary)"
    const userId = !isBroadcast ? mentionMap[part.slice(1).toLowerCase()] : undefined
    if (!overlay && userId) {
      return <Link key={i} href={`/perfil/${userId}`} style={{ color, fontWeight: 600 }}>{part}</Link>
    }
    return <span key={i} style={{ color, fontWeight: 600 }}>{part}</span>
  })
}

export function MentionInput({
  inputRef, value, onChange, placeholder, autoFocus, onFocus, onKeyUp, onKeyDown, className = "",
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  onFocus?: () => void
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  className?: string
}) {
  const [scroll, setScroll] = useState(0)
  const sync = () => setScroll(inputRef.current?.scrollLeft ?? 0)

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => { onChange(e.target.value); requestAnimationFrame(sync) }}
        onFocus={onFocus}
        onKeyUp={(e) => { onKeyUp?.(e); sync() }}
        onKeyDown={onKeyDown}
        onSelect={sync}
        onScroll={sync}
        onMouseUp={sync}
        className={`w-full border px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[var(--muted)] ${className}`}
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "transparent", caretColor: "var(--text)", fontSize: "16px" }}
      />
      <div
        className={`absolute inset-0 flex items-center overflow-hidden border border-transparent px-3 text-sm pointer-events-none select-none ${className}`}
        style={{ fontSize: "16px", color: "var(--text)", background: "transparent" }}
        aria-hidden
      >
        <span className="whitespace-pre" style={{ transform: `translateX(${-scroll}px)` }}>
          {highlightMentions(value, {}, true)}
        </span>
      </div>
    </div>
  )
}
