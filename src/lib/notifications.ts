import { db } from "./db"

export async function createNotification({
  userId,
  type,
  title,
  body,
  url,
}: {
  userId: string
  type: "mention" | "stars" | "broadcast"
  title: string
  body: string
  url?: string
}) {
  await db.notification.create({ data: { userId, type, title, body, url: url ?? null } })
}

export async function createBroadcastNotifications({
  excludeUserId,
  title,
  body,
  url,
}: {
  excludeUserId: string
  title: string
  body: string
  url?: string
}) {
  const users = await db.user.findMany({
    where: { id: { not: excludeUserId } },
    select: { id: true },
  })
  await db.notification.createMany({
    data: users.map((u) => ({ userId: u.id, type: "broadcast", title, body, url: url ?? null })),
  })
}
