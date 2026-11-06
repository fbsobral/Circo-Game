import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { forbidden, requireAdmin, validateSeason } from "./validate"

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return forbidden()

  const body = await req.json().catch(() => ({}))
  const result = await validateSeason(body)
  if (result.error) return result.error

  const season = await db.season.create({ data: result.data })
  return NextResponse.json(season)
}
