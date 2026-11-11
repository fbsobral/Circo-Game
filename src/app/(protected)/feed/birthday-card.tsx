import Link from "next/link"
import { Avatar } from "@/components/ui/avatar"
import { upcomingBirthdays } from "@/lib/birthdays"

function whenLabel(daysUntil: number, birthDate: Date) {
  if (daysUntil === 1) return "amanhã"
  const day = String(birthDate.getUTCDate()).padStart(2, "0")
  const month = String(birthDate.getUTCMonth() + 1).padStart(2, "0")
  return `${day}/${month}`
}

function joinNames(names: string[]) {
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}` : names[0]
}

export async function BirthdayCard({ currentUserId }: { currentUserId: string }) {
  const birthdays = await upcomingBirthdays(7)
  if (birthdays.length === 0) return null

  const today = birthdays.filter((b) => b.daysUntil === 0)
  const upcoming = birthdays.filter((b) => b.daysUntil > 0)
  const firstName = (name: string | null) => name?.split(" ")[0] ?? "Alguém"
  const others = today.filter((b) => b.id !== currentUserId)
  const isMyBirthday = today.some((b) => b.id === currentUserId)

  return (
    <div
      className="rounded-xl px-4 py-3 space-y-3"
      style={{ border: "1px solid rgba(244,114,182,0.25)", background: "rgba(244,114,182,0.06)" }}
    >
      {today.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">🎂</span>
          <div className="flex-1 min-w-0">
            {isMyBirthday && (
              <p className="text-sm font-semibold" style={{ color: "#f472b6" }}>Feliz aniversário! A turma toda celebra com você.</p>
            )}
            {others.length > 0 && (
              <p className="text-sm">
                Hoje é aniversário de{" "}
                <span className="font-semibold" style={{ color: "#f472b6" }}>{joinNames(others.map((b) => firstName(b.name)))}</span>
                ! Deixe seus parabéns.
              </p>
            )}
          </div>
          <div className="flex -space-x-2 flex-shrink-0">
            {today.map((b) => (
              <Link key={b.id} href={`/perfil/${b.id}`} title={b.name ?? ""}>
                <Avatar name={b.name} image={b.image} size="sm" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs">
          <span className="font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-cormorant)", color: "#f472b6" }}>
            Próximos aniversários
          </span>
          {upcoming.map((b) => (
            <Link key={b.id} href={`/perfil/${b.id}`} className="hover:underline">
              <span className="user-name font-medium">{firstName(b.name)}</span>
              <span className="text-[var(--muted)]"> · {whenLabel(b.daysUntil, b.birthDate)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
