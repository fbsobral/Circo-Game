import { db } from "./db"
import { sendMentionEmail } from "./email"
import { createNotification, createBroadcastNotifications } from "./notifications"

export function extractMentionNames(content: string): string[] {
  const matches = content.match(/(@todos|@\p{Lu}\S*(?:\s+\p{Lu}\S*)*)/gu) ?? []
  return [...new Set(matches.map((m) => m.slice(1).trim()))]
}

type MentionableUser = { id: string; name: string | null; email: string }

const TRAILING_PUNCTUATION = /[.,;:!?…)\]}"']+$/u

function resolveMentions(content: string, users: MentionableUser[]) {
  const byName = new Map<string, string>()
  for (const u of users) if (u.name) byName.set(u.name.trim().toLowerCase(), u.id)

  const ids = new Set<string>()
  let todos = false
  for (const candidate of extractMentionNames(content)) {
    if (candidate.toLowerCase() === "todos") { todos = true; continue }
    const words = candidate.split(/\s+/)
    for (let k = words.length; k >= 1; k--) {
      const name = words.slice(0, k).join(" ").replace(TRAILING_PUNCTUATION, "").toLowerCase()
      const id = byName.get(name)
      if (id) { ids.add(id); break }
    }
  }
  return { ids, todos }
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
  if (!content.includes("@")) return

  const users = await db.user.findMany({ select: { id: true, name: true, email: true } })
  const current = resolveMentions(content, users)
  const previous = previousContent ? resolveMentions(previousContent, users) : { ids: new Set<string>(), todos: false }
  if (previous.todos) return

  const postUrl = overrideUrl ?? `${baseUrl}/post/${postId}`
  const preview = content.length > 200 ? content.slice(0, 200) + "…" : content
  const contextLabel = context === "post" ? "publicação" : "comentário"

  if (current.todos) {
    const excludeIds = [authorId, ...previous.ids]
    const recipients = users.filter((u) => !excludeIds.includes(u.id))

    await createBroadcastNotifications({
      excludeUserId: excludeIds,
      title: `${authorName} mencionou @todos`,
      body: preview,
      url: postUrl,
    })

    await Promise.allSettled(
      recipients.map((u) =>
        sendMentionEmail(u.email, u.name ?? "Aluno", authorName, context, postUrl, preview)
      )
    )
    return
  }

  const mentioned = users.filter((u) => current.ids.has(u.id) && !previous.ids.has(u.id) && u.id !== authorId)

  await Promise.allSettled(
    mentioned.map(async (u) => {
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
