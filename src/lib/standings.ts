import { db } from "./db"
import { SCORE_RECORD_SELECT, scoreRecords } from "./scoring"
import { getActiveSeason, seasonRecordWhere } from "./seasons"

export interface Standing {
  score: number
  position: number
  tied: number
  total: number
}

// Posições no ranking principal (período ativo, ou geral se não houver).
export async function getStandings(): Promise<Map<string, Standing>> {
  const activeSeason = await getActiveSeason()
  const users = await db.user.findMany({
    where: { role: { in: ["student", "admin"] } },
    select: { id: true, birthDate: true, starRecords: { where: seasonRecordWhere(activeSeason), select: SCORE_RECORD_SELECT } },
  })

  const scored = users.map((u) => ({ id: u.id, score: scoreRecords(u.starRecords, u.birthDate).score }))

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
