import { db } from "./db"

// Situação do período pelas datas (não confundir com o período ativo, escolhido à mão).
export type SeasonStatus = "upcoming" | "current" | "finished"

export interface SeasonLike {
  startDate: Date
  endDate: Date
}

const DAY_MS = 24 * 60 * 60 * 1000

// Datas de temporada são dias inteiros (UTC), como as datas das aulas.
export function seasonClassDateFilter(season: SeasonLike) {
  return { gte: season.startDate, lt: new Date(season.endDate.getTime() + DAY_MS) }
}

// "Hoje" no fuso do Brasil, como dia UTC para comparar com as datas da temporada.
function today(now: Date): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now)
  return new Date(ymd + "T00:00:00Z")
}

export function seasonStatus(season: SeasonLike, now = new Date()): SeasonStatus {
  const day = today(now)
  if (day < season.startDate) return "upcoming"
  if (day > season.endDate) return "finished"
  return "current"
}

export function parseSeasonDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(value + "T00:00:00Z")
  return Number.isNaN(date.getTime()) ? null : date
}

export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function listSeasons() {
  return db.season.findMany({ orderBy: { startDate: "desc" } })
}

// O período ativo vale como ranking principal em todo o app. Sem período ativo, vale o geral.
export async function getActiveSeason() {
  return db.season.findFirst({ where: { active: true } })
}

// Filtro de StarRecord para o período (ou undefined = todas as aulas).
export function seasonRecordWhere(season: SeasonLike | null) {
  return season ? { class: { date: seasonClassDateFilter(season) } } : undefined
}

export function isInSeason(date: Date, season: SeasonLike | null): boolean {
  if (!season) return true
  const range = seasonClassDateFilter(season)
  return date >= range.gte && date < range.lt
}

// Ativa um período e desativa os outros (só um ativo por vez).
export async function setActiveSeason(id: string | null) {
  await db.$transaction([
    db.season.updateMany({ where: { active: true, ...(id ? { id: { not: id } } : {}) }, data: { active: false } }),
    ...(id ? [db.season.update({ where: { id }, data: { active: true } })] : []),
  ])
}
