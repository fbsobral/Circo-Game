import { db } from "./db"
import { sendMentionEmail } from "./email"

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

  const users = await db.user.findMany({
    where: {
      name: { in: names, mode: "insensitive" },
      id: { not: authorId },
    },
    select: { id: true, name: true, email: true },
  })

  const postUrl = `${baseUrl}/feed#post-${postId}`
  const preview = content.length > 200 ? content.slice(0, 200) + "…" : content

  await Promise.allSettled(
    users.map((u) =>
      sendMentionEmail(u.email, u.name ?? "Aluno", authorName, context, postUrl, preview)
    )
  )
}
