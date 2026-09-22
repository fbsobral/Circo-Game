import { db } from "./db"
import { sendMentionEmail } from "./email"
import { createNotification, createBroadcastNotifications } from "./notifications"

function extractMentionNames(content: string): string[] {
  const matches = content.match(/@([^\s@#]+(?:\s+[^\s@#]+)*)/g) ?? []
  return [...new Set(matches.map((m) => m.slice(1).trim()))]
}

export async function notifyMentions(
  content: string,
  authorId: string,
  authorName: string,
  context: "post" | "comment",
  postId: string,
  baseUrl: string,
) {
  const names = extractMentionNames(content)
  if (!names.length) return

  const postUrl = `${baseUrl}/feed#post-${postId}`
  const preview = content.length > 200 ? content.slice(0, 200) + "…" : content
  const contextLabel = context === "post" ? "publicação" : "comentário"

  // Handle @todos
  if (names.some((n) => n.toLowerCase() === "todos")) {
    const allUsers = await db.user.findMany({
      where: { id: { not: authorId } },
      select: { id: true, name: true, email: true },
    })

    await createBroadcastNotifications({
      excludeUserId: authorId,
      title: `${authorName} mencionou @todos`,
      body: preview,
      url: postUrl,
    })

    await Promise.allSettled(
      allUsers.map((u) =>
        sendMentionEmail(u.email, u.name ?? "Aluno", authorName, context, postUrl, preview)
      )
    )
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
