import { db } from "./db"

export type SeasonStatus = "upcoming" | "active" | "finished"

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
  return "active"
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

export async function findOverlappingSeason(startDate: Date, endDate: Date, ignoreId?: string) {
  return db.season.findFirst({
    where: {
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
    },
  })
}
