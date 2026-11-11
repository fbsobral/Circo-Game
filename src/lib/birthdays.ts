import { db } from "./db"

const TIME_ZONE = "America/Sao_Paulo"
const DAY_MS = 24 * 60 * 60 * 1000
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]

// "Hoje" no fuso do Brasil, como dia UTC (mesmo formato das datas @db.Date).
export function todayUtc(now = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now)
  return new Date(ymd + "T00:00:00Z")
}

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

// Data do aniversário no ano informado. Quem nasceu em 29/02 comemora em 28/02 nos anos não bissextos.
function birthdayInYear(birthDate: Date, year: number): Date {
  const month = birthDate.getUTCMonth()
  let day = birthDate.getUTCDate()
  if (month === 1 && day === 29 && !isLeapYear(year)) day = 28
  return new Date(Date.UTC(year, month, day))
}

// Dias até o próximo aniversário (0 = hoje).
export function daysUntilBirthday(birthDate: Date, today = todayUtc()): number {
  let next = birthdayInYear(birthDate, today.getUTCFullYear())
  if (next < today) next = birthdayInYear(birthDate, today.getUTCFullYear() + 1)
  return Math.round((next.getTime() - today.getTime()) / DAY_MS)
}

export function formatBirthday(birthDate: Date | string): string {
  const d = new Date(birthDate)
  return `${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`
}

export function parseBirthDate(value: unknown): Date | null | undefined {
  if (value === null || value === "") return null
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(value + "T00:00:00Z")
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return undefined
  if (date.getUTCFullYear() < 1900 || date > todayUtc()) return undefined
  return date
}

export async function upcomingBirthdays(withinDays = 7) {
  const today = todayUtc()
  const users = await db.user.findMany({
    where: { birthDate: { not: null } },
    select: { id: true, name: true, image: true, birthDate: true },
  })
  return users
    .map((u) => ({ ...u, birthDate: u.birthDate!, daysUntil: daysUntilBirthday(u.birthDate!, today) }))
    .filter((u) => u.daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil || (a.name ?? "").localeCompare(b.name ?? ""))
}

// Cria, uma vez por dia, as notificações de aniversário para quem está vendo.
// Roda quando a pessoa abre as notificações, então não depende de agendador.
export async function ensureBirthdayNotifications(userId: string) {
  const birthdays = (await upcomingBirthdays(0))
  if (birthdays.length === 0) return

  const startOfDay = new Date(todayUtc().getTime() + 3 * 60 * 60 * 1000) // 00:00 em São Paulo (UTC-3)
  const already = await db.notification.findMany({
    where: { userId, type: "birthday", createdAt: { gte: startOfDay } },
    select: { url: true },
  })
  const sent = new Set(already.map((n) => n.url))

  const data = birthdays
    .map((b) => {
      const url = `/perfil/${b.id}`
      if (sent.has(url)) return null
      const firstName = b.name?.split(" ")[0] ?? "Alguém"
      return b.id === userId
        ? { userId, type: "birthday", url, title: "Feliz aniversário! 🎂", body: "A turma do Circo deseja um dia incrível pra você!" }
        : { userId, type: "birthday", url, title: `Hoje é aniversário de ${firstName}! 🎂`, body: `Deixe seus parabéns para ${b.name ?? firstName}.` }
    })
    .filter((n) => n !== null)

  if (data.length) await db.notification.createMany({ data })
}
