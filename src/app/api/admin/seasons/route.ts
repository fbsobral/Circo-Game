import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { setActiveSeason } from "@/lib/seasons"
import { forbidden, requireStaff, validateSeason } from "./validate"

export async function POST(req: NextRequest) {
  if (!(await requireStaff())) return forbidden()

  const body = await req.json().catch(() => ({}))
  const result = validateSeason(body)
  if (result.error) return result.error

  const season = await db.season.create({ data: result.data })
  if (body.active === true) await setActiveSeason(season.id)
  return NextResponse.json(season)
}
