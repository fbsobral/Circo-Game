import { db } from "./db"
import { sendMentionEmail } from "./email"
import { createNotification, createBroadcastNotifications } from "./notifications"

export function extractMentionNames(content: string): string[] {
  const matches = content.match(/(@todos|@\p{Lu}\S*(?:\s+\p{Lu}\S*)*)/gu) ?? []
  return [...new Set(matches.map((m) => m.slice(1).trim()))]
}

export async function notifyMentions(
  content: string,
  authorId: string,
  authorName: string,
  context: "post" | "comment",
  postId: string,
  baseUrl: string,
  overrideUrl?: string,
  previousContent?: string,
) {
  const previousNames = previousContent ? extractMentionNames(previousContent).map((n) => n.toLowerCase()) : []
  if (previousNames.includes("todos")) return

  const names = extractMentionNames(content).filter((n) => !previousNames.includes(n.toLowerCase()))
  if (!names.length) return

  const postUrl = overrideUrl ?? `${baseUrl}/feed#post-${postId}`
  const preview = content.length > 200 ? content.slice(0, 200) + "…" : content
  const contextLabel = context === "post" ? "publicação" : "comentário"

  // Handle @todos
  if (names.some((n) => n.toLowerCase() === "todos")) {
    const alreadyNotified = previousNames.length
      ? await db.user.findMany({
          where: { name: { in: previousNames, mode: "insensitive" } },
          select: { id: true },
        })
      : []
    const excludeIds = [authorId, ...alreadyNotified.map((u) => u.id)]

    const allUsers = await db.user.findMany({
      where: { id: { notIn: excludeIds } },
      select: { id: true, name: true, email: true },
    })

    await createBroadcastNotifications({
      excludeUserId: excludeIds,
      title: `${authorName} mencionou @todos`,
      body: preview,
      url: postUrl,
    })

    await Promise.allSettled(
      allUsers.map((u) =>
        sendMentionEmail(u.email, u.name ?? "Aluno", authorName, context, postUrl, preview)
      )
    )
    return
  }

  // Handle individual mentions (skip "todos")
  const individualNames = names.filter((n) => n.toLowerCase() !== "todos")
  if (!individualNames.length) return

  const users = await db.user.findMany({
    where: {
      name: { in: individualNames, mode: "insensitive" },
      id: { not: authorId },
    },
    select: { id: true, name: true, email: true },
  })

  await Promise.allSettled(
    users.map(async (u) => {
      await createNotification({
        userId: u.id,
        type: "mention",
        title: `${authorName} te mencionou em uma ${contextLabel}`,
        body: preview,
        url: postUrl,
      })
      await sendMentionEmail(u.email, u.name ?? "Aluno", authorName, context, postUrl, preview)
    })
  )
}
