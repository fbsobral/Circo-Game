import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

function typeIcon(type: string) {
  if (type === "stars") return { icon: "★", bg: "rgba(201,168,76,0.15)", color: "var(--star-active)" }
  if (type === "broadcast") return { icon: "📢", bg: "rgba(140,100,220,0.15)", color: "#a78bfa" }
  return { icon: "@", bg: "rgba(100,160,220,0.15)", color: "#60a5fa" }
}

export default async function NotificacoesPage() {
  const session = await auth()

  const notifications = await db.notification.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  // Mark all as read
  await db.notification.updateMany({
    where: { userId: session!.user.id, read: false },
    data: { read: true },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-cormorant)" }}>
        Notificações
      </h1>

      {notifications.length === 0 && (
        <div
          className="rounded-2xl py-16 text-center"
          style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
        >
          <div className="text-3xl mb-3 opacity-30">🔔</div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Nenhuma notificação ainda</p>
        </div>
      )}

      {notifications.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden divide-y"
          style={{ border: "1px solid var(--border)", background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {notifications.map((n) => {
            const { icon, bg, color } = typeIcon(n.type)
            const content = (
              <div className="flex gap-4 px-5 py-4">
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base mt-0.5"
                  style={{ background: bg, color }}
                >
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold leading-snug">{n.title}</div>
                  <div className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>{n.body}</div>
                  <div className="text-[11px] mt-1.5" style={{ color: "var(--muted)" }}>{formatDate(n.createdAt)}</div>
                </div>
              </div>
            )

            return n.url ? (
              <Link key={n.id} href={n.url} className="block hover:bg-[var(--surface-2)] transition-colors">
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
