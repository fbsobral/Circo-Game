import { cn } from "@/lib/utils"

interface AvatarProps {
  name?: string | null
  image?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  totalStars?: number
  className?: string
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
}

function getInitials(name?: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function getBorderColor(totalStars?: number) {
  if (!totalStars) return "border-[var(--border)]"
  if (totalStars >= 100) return "border-[var(--star-active)]"
  if (totalStars >= 25) return "border-[var(--primary)]"
  return "border-[var(--border)]"
}

export function Avatar({ name, image, size = "md", totalStars, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full border-2 flex items-center justify-center overflow-hidden bg-[var(--surface-2)] text-[var(--text)] font-semibold flex-shrink-0",
        sizeMap[size],
        getBorderColor(totalStars),
        className,
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}
