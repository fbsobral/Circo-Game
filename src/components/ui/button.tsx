"use client"

import { cn } from "@/lib/utils"
import { type ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "outline"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-[var(--primary)] text-[#0d0d14] hover:bg-[var(--primary-hover)] active:scale-95": variant === "primary",
            "bg-transparent text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]": variant === "ghost",
            "bg-[var(--danger)] text-white hover:opacity-90 active:scale-95": variant === "danger",
            "border border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)]": variant === "outline",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-5 py-2.5 text-sm": size === "md",
            "px-7 py-3 text-base": size === "lg",
          },
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  },
)
Button.displayName = "Button"
