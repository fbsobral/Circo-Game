import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const all = searchParams.get("all") === "1"

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: all ? 100 : 10,
  })

  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, read: false },
  })

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { ids } = await req.json() as { ids?: string[] }

  if (ids?.length) {
    await db.notification.updateMany({
      where: { userId: session.user.id, id: { in: ids } },
      data: { read: true },
    })
  } else {
    await db.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    })
  }

  return NextResponse.json({ ok: true })
}
