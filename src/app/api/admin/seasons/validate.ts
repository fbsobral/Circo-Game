import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { cleanText } from "@/lib/security"
import { findOverlappingSeason, parseSeasonDate } from "@/lib/seasons"

export async function requireAdmin() {
  const session = await auth()
  return (session?.user as { role?: string })?.role === "admin"
}

export const forbidden = () => NextResponse.json({ error: "Não autorizado" }, { status: 403 })

// Retorna os dados validados ou a resposta de erro.
export async function validateSeason(body: Record<string, unknown>, ignoreId?: string) {
  const name = cleanText(body.name, 60)
  const startDate = parseSeasonDate(body.startDate)
  const endDate = parseSeasonDate(body.endDate)
  if (!name) return { error: NextResponse.json({ error: "Informe o nome da temporada" }, { status: 400 }) }
  if (!startDate || !endDate) return { error: NextResponse.json({ error: "Informe datas de início e fim válidas" }, { status: 400 }) }
  if (endDate < startDate) return { error: NextResponse.json({ error: "A data de fim deve ser depois do início" }, { status: 400 }) }

  const overlap = await findOverlappingSeason(startDate, endDate, ignoreId)
  if (overlap) {
    return { error: NextResponse.json({ error: `O período se sobrepõe à temporada "${overlap.name}"` }, { status: 409 }) }
  }
  return { data: { name, startDate, endDate } }
}
