import { cn } from "@/lib/utils"

export function Card({ className, children, glow }: { className?: string; children: React.ReactNode; glow?: boolean }) {
  return (
    <div
      className={cn("rounded-2xl p-6 relative overflow-hidden", className)}
      style={{
        background: "linear-gradient(160deg, var(--surface) 0%, #0f0f20 100%)",
        border: "1px solid var(--border-bright)",
        boxShadow: glow
          ? "0 0 30px rgba(201,168,76,0.1), 0 8px 32px rgba(0,0,0,0.4)"
          : "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {glow && (
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)" }}
        />
      )}
      {children}
    </div>
  )
}
