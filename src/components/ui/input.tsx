import { cn } from "@/lib/utils"
import { type InputHTMLAttributes, forwardRef } from "react"

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors",
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = "Input"
