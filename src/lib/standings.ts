import { db } from "./db"

export interface Standing {
  score: number
  position: number
  tied: number
  total: number
}

export async function getStandings(): Promise<Map<string, Standing>> {
  const users = await db.user.findMany({
    where: { role: { in: ["student", "admin"] } },
    select: { id: true, starRecords: { select: { stars: true, absent: true, diamond: true } } },
  })

  const scored = users.map((u) => {
    const stars = u.starRecords.reduce((s, r) => s + (r.absent ? 0 : r.stars), 0)
    const diamonds = u.starRecords.filter((r) => !r.absent && r.diamond).length
    const expected = u.starRecords.filter((r) => r.absent || r.stars > 0).length
    return { id: u.id, score: expected > 0 ? (stars + diamonds) / expected : 0 }
  })

  return new Map(
    scored.map((u) => [
      u.id,
      {
        score: u.score,
        position: scored.filter((o) => o.score > u.score).length + 1,
        tied: scored.filter((o) => o.id !== u.id && o.score === u.score).length,
        total: scored.length,
      },
    ]),
  )
}
