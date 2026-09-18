"use client"

import { cn } from "@/lib/utils"

interface StarsDisplayProps {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
}

const sizeMap = { sm: "text-base", md: "text-xl", lg: "text-3xl" }

export function StarsDisplay({ value, max = 3, size = "md" }: StarsDisplayProps) {
  return (
    <div className={cn("flex gap-0.5", sizeMap[size])}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{
            color: i < value ? "var(--star-active)" : "var(--star-empty)",
            filter: i < value ? "drop-shadow(0 0 4px rgba(240,192,64,0.5))" : undefined,
            transition: "all 0.2s",
          }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

interface StarsPickerProps {
  value: number
  onChange: (val: number) => void
  disabled?: boolean
}

export function StarsPicker({ value, onChange, disabled }: StarsPickerProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === n ? 0 : n)}
          className={cn(
            "text-2xl transition-all duration-150 hover:scale-125 active:scale-90 disabled:cursor-not-allowed",
          )}
          style={{
            color: n <= value ? "var(--star-active)" : "var(--star-empty)",
            filter: n <= value ? "drop-shadow(0 0 8px rgba(240,192,64,0.7))" : undefined,
          }}
        >
          ★
        </button>
      ))}
    </div>
  )
}
