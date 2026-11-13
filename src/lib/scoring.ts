import { birthMonthDay, isBirthdayOn } from "./birthday-match"

// Campos de StarRecord necessários para calcular a pontuação.
export const SCORE_RECORD_SELECT = {
  stars: true,
  absent: true,
  diamond: true,
  class: { select: { id: true, date: true } },
} as const

export interface ScoreRecord {
  stars: number
  absent: boolean
  diamond: boolean
  class: { id: string; date: Date }
}

// Bônus de assiduidade: a 2ª aula presente na mesma semana vale +0,5 ponto.
// No máximo um bônus por semana (3ª aula em diante não soma mais).
export const WEEKLY_BONUS = 0.5

// A aula caiu no dia do aniversário da pessoa? (datas das aulas são dias UTC)
export function isBirthdayClass(birthDate: Date | null | undefined, classDate: Date): boolean {
  if (!birthDate) return false
  return isBirthdayOn(birthMonthDay(birthDate), classDate.toISOString().slice(0, 10))
}

// 🎂 Bolo: presença em aula no dia do próprio aniversário vale +1 ponto, como o 💎.
export function hasBirthdayCake(record: ScoreRecord, birthDate: Date | null | undefined): boolean {
  return !record.absent && isBirthdayClass(birthDate, record.class.date)
}

const DAY_MS = 24 * 60 * 60 * 1000

// Segunda-feira (dia UTC) da semana da aula; semanas vão de segunda a domingo.
function weekKey(date: Date): number {
  const day = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const weekday = (new Date(day).getUTCDay() + 6) % 7 // 0 = segunda
  return day - weekday * DAY_MS
}

// Ordem das aulas dentro da semana: data, depois id (desempate estável).
function classOrder(a: { id: string; date: Date }, b: { id: string; date: Date }) {
  return a.date.getTime() - b.date.getTime() || a.id.localeCompare(b.id)
}

// Ids das aulas que deram o bônus de assiduidade (a 2ª presença de cada semana).
export function weeklyBonusClassIds(records: ScoreRecord[]): Set<string> {
  const present = records.filter((r) => !r.absent).map((r) => r.class).sort(classOrder)
  const countByWeek = new Map<number, number>()
  const ids = new Set<string>()
  for (const cls of present) {
    const week = weekKey(cls.date)
    const count = (countByWeek.get(week) ?? 0) + 1
    countByWeek.set(week, count)
    if (count === 2) ids.add(cls.id)
  }
  return ids
}

export function scoreRecords(records: ScoreRecord[], birthDate: Date | null | undefined) {
  const totalStars = records.reduce((s, r) => s + (r.absent ? 0 : r.stars), 0)
  const totalDiamonds = records.filter((r) => !r.absent && r.diamond).length
  const totalCakes = records.filter((r) => hasBirthdayCake(r, birthDate)).length
  const weeklyBonuses = weeklyBonusClassIds(records).size
  const weeklyBonusPoints = weeklyBonuses * WEEKLY_BONUS
  const totalPoints = totalStars + totalDiamonds + totalCakes + weeklyBonusPoints
  const expectedClasses = records.filter((r) => r.absent || r.stars > 0).length
  const classCount = records.filter((r) => !r.absent).length
  const score = expectedClasses > 0 ? totalPoints / expectedClasses : 0
  return { totalStars, totalDiamonds, totalCakes, weeklyBonuses, weeklyBonusPoints, totalPoints, expectedClasses, classCount, score }
}

// Pontos com até uma casa decimal, no formato brasileiro (ex.: 31,5).
export function formatPoints(points: number): string {
  return points.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
}
