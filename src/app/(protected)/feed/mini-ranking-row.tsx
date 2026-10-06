"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

export interface MiniRankingEntry {
  id: string
  medal: string
  name: string
  score: string
  first: boolean
}

const SPEED_PX_PER_SECOND = 40

function Entries({ entries }: { entries: MiniRankingEntry[] }) {
  return (
    <>
      {entries.map((u) => (
        <span key={u.id} className="flex items-center gap-1.5 flex-shrink-0 text-sm">
          <span>{u.medal}</span>
          <span className="user-name font-medium">{u.name}</span>
          <span className="font-bold" style={{ fontFamily: "var(--font-cormorant)", color: u.first ? "var(--star-active)" : "var(--primary)" }}>
            {u.score} ★
          </span>
        </span>
      ))}
    </>
  )
}

export function MiniRankingRow({ entries }: { entries: MiniRankingEntry[] }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const setRef = useRef<HTMLDivElement>(null)
  const [setWidth, setSetWidth] = useState(0)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const viewport = viewportRef.current
    const set = setRef.current
    if (!viewport || !set) return
    const measure = () => {
      const width = set.scrollWidth
      setSetWidth(width)
      setOverflowing(width > viewport.clientWidth)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(viewport)
    ro.observe(set)
    return () => ro.disconnect()
  }, [entries])

  return (
    <Link href="/ranking" className="block">
      <div
        className="rounded-xl flex items-center gap-4 px-3 py-2"
        style={{ border: "1px solid rgba(201,168,76,0.2)", background: "rgba(201,168,76,0.06)" }}
      >
        <span
          className="text-xs font-bold tracking-widest flex-shrink-0"
          style={{ fontFamily: "var(--font-cormorant)", color: "var(--primary)", textTransform: "uppercase" }}
        >
          Ranking
        </span>
        <div ref={viewportRef} className="marquee-viewport flex-1 min-w-0">
          <div
            className={`flex w-max whitespace-nowrap ${overflowing ? "marquee-track" : ""}`}
            style={overflowing ? { animationDuration: `${Math.max(setWidth / SPEED_PX_PER_SECOND, 6)}s` } : undefined}
          >
            <div ref={setRef} className="flex items-center gap-6 pr-6 flex-shrink-0">
              <Entries entries={entries} />
            </div>
            {overflowing && (
              <div aria-hidden className="flex items-center gap-6 pr-6 flex-shrink-0">
                <Entries entries={entries} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
