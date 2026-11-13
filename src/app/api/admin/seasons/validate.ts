import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { cleanText } from "@/lib/security"
import { parseSeasonDate } from "@/lib/seasons"

// Admins e professores gerenciam as temporadas do ranking.
export async function requireStaff() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  return role === "admin" || role === "professor"
}

export const forbidden = () => NextResponse.json({ error: "Não autorizado" }, { status: 403 })

// Retorna os dados validados ou a resposta de erro. Temporadas podem se sobrepor (ex.: semestre dentro do ano).
export function validateSeason(body: Record<string, unknown>) {
  const name = cleanText(body.name, 60)
  const startDate = parseSeasonDate(body.startDate)
  const endDate = parseSeasonDate(body.endDate)
  if (!name) return { error: NextResponse.json({ error: "Informe o nome da temporada" }, { status: 400 }) }
  if (!startDate || !endDate) return { error: NextResponse.json({ error: "Informe datas de início e fim válidas" }, { status: 400 }) }
  if (endDate < startDate) return { error: NextResponse.json({ error: "A data de fim deve ser depois do início" }, { status: 400 }) }
  return { data: { name, startDate, endDate } }
}
