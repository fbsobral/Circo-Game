import { birthMonthDay, isBirthdayOn } from "./birthday-match"

// Campos de StarRecord necessários para calcular a pontuação.
export const SCORE_RECORD_SELECT = {
  stars: true,
  absent: true,
  diamond: true,
  class: { select: { date: true } },
} as const

export interface ScoreRecord {
  stars: number
  absent: boolean
  diamond: boolean
  class: { date: Date }
}

// A aula caiu no dia do aniversário da pessoa? (datas das aulas são dias UTC)
export function isBirthdayClass(birthDate: Date | null | undefined, classDate: Date): boolean {
  if (!birthDate) return false
  return isBirthdayOn(birthMonthDay(birthDate), classDate.toISOString().slice(0, 10))
}

// 🎂 Bolo: presença em aula no dia do próprio aniversário vale +1 ponto, como o 💎.
export function hasBirthdayCake(record: ScoreRecord, birthDate: Date | null | undefined): boolean {
  return !record.absent && isBirthdayClass(birthDate, record.class.date)
}

export function scoreRecords(records: ScoreRecord[], birthDate: Date | null | undefined) {
  const totalStars = records.reduce((s, r) => s + (r.absent ? 0 : r.stars), 0)
  const totalDiamonds = records.filter((r) => !r.absent && r.diamond).length
  const totalCakes = records.filter((r) => hasBirthdayCake(r, birthDate)).length
  const totalPoints = totalStars + totalDiamonds + totalCakes
  const expectedClasses = records.filter((r) => r.absent || r.stars > 0).length
  const classCount = records.filter((r) => !r.absent).length
  const score = expectedClasses > 0 ? totalPoints / expectedClasses : 0
  return { totalStars, totalDiamonds, totalCakes, totalPoints, expectedClasses, classCount, score }
}
