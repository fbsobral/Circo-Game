"use client"

import { useState, useRef, useCallback, useEffect } from "react"
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

export function useFlipUp(ref: React.RefObject<HTMLDivElement | null>) {
  const [flipUp, setFlipUp] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setFlipUp(rect.top + rect.height > window.innerHeight - 8)
  }, [ref])
  return flipUp
}

export function getCaretCoords(el: HTMLTextAreaElement, pos: number) {
  const mirror = document.createElement("div")
  const cs = getComputedStyle(el)
  const rect = el.getBoundingClientRect()
  Object.assign(mirror.style, {
    position: "fixed", top: rect.top + "px", left: "-9999px",
    visibility: "hidden", width: rect.width + "px",
    padding: cs.padding, font: cs.font, lineHeight: cs.lineHeight,
    whiteSpace: "pre-wrap", wordBreak: "break-word", boxSizing: cs.boxSizing,
  })
  mirror.textContent = el.value.slice(0, pos)
  const span = document.createElement("span")
  span.textContent = "​"
  mirror.appendChild(span)
  document.body.appendChild(mirror)
  const spanTop = span.getBoundingClientRect().top
  document.body.removeChild(mirror)
  const lineH = parseFloat(cs.lineHeight) || 24
  return { top: spanTop - el.scrollTop + lineH, left: rect.left + parseInt(cs.paddingLeft || "0") }
}

export function useMentionAutocomplete(
  ref: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
  value: string,
  setValue: (v: string) => void,
  onFocusMentions: () => void,
) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState(0)
  const [caretCoords, setCaretCoords] = useState<{ top: number; left: number } | null>(null)

  function onKeyUp() {
    const el = ref.current
    if (!el) return
    const cursor = el.selectionStart ?? 0
    const before = el.value.slice(0, cursor)
    const match = before.match(/@(\w[\w\s]*)$/)
    const coords = el instanceof HTMLTextAreaElement
      ? getCaretCoords(el, cursor - (match ? match[0].length : 1))
      : null
    if (match) {
      setMentionQuery(match[1])
      setMentionStart(cursor - match[0].length)
      setCaretCoords(coords)
      onFocusMentions()
    } else if (before.endsWith("@")) {
      setMentionQuery("")
      setMentionStart(cursor - 1)
      setCaretCoords(coords)
      onFocusMentions()
    } else {
      setMentionQuery(null)
      setCaretCoords(null)
    }
  }

  function selectMention(name: string) {
    const el = ref.current
    if (!el) return
    const cursor = el.selectionStart ?? value.length
    const before = value.slice(0, mentionStart)
    const after = value.slice(cursor)
    setValue(`${before}@${name} ${after}`)
    setMentionQuery(null)
    setCaretCoords(null)
    setTimeout(() => {
      el.focus()
      const pos = mentionStart + name.length + 2
      el.setSelectionRange(pos, pos)
    }, 0)
  }

  return { mentionQuery, selectMention, onKeyUp, caretCoords }
}

export function MentionDropdown({
  users, query, onSelect, caretCoords,
}: {
  users: MentionUser[]
  query: string
  onSelect: (name: string) => void
  caretCoords?: { top: number; left: number } | null
}) {
  const showTodos = "todos".includes(query.toLowerCase())
  const filtered = users.filter((u) => u.name?.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
  const ref = useRef<HTMLDivElement>(null)
  const flipUp = useFlipUp(ref)
  if (!showTodos && !filtered.length) return null

  const fixedStyle = caretCoords
    ? { position: "fixed" as const, top: caretCoords.top, left: caretCoords.left }
    : { ...(flipUp ? { bottom: "100%", marginBottom: 4 } : { top: "100%", marginTop: 4 }), left: 0 }

  return (
    <div
      ref={ref}
      className="absolute z-50 rounded-xl shadow-xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", ...fixedStyle, minWidth: 200 }}
    >
      {showTodos && (
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onSelect("todos") }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-[var(--surface-2)] transition-colors border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: "rgba(140,100,220,0.15)", color: "#a78bfa" }}>📢</span>
          <div>
            <div className="font-semibold" style={{ color: "#a78bfa" }}>@todos</div>
            <div className="text-[11px]" style={{ color: "var(--muted)" }}>Notifica todos os membros</div>
          </div>
        </button>
      )}
      {filtered.map((u) => (
        <button
          key={u.id}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onSelect(u.name ?? "") }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-[var(--surface-2)] transition-colors"
        >
          <Avatar name={u.name} image={u.image} size="sm" />
          <span>{u.name}</span>
        </button>
      ))}
    </div>
  )
}
