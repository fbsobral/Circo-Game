import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { setActiveSeason } from "@/lib/seasons"
import { forbidden, requireStaff, validateSeason } from "../validate"

// Edita nome/datas, ou só liga/desliga a temporada ativa com { active: boolean }.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) return forbidden()

  const { id } = await params
  const existing = await db.season.findUnique({ where: { id }, select: { id: true, active: true } })
  if (!existing) return NextResponse.json({ error: "Temporada não encontrada" }, { status: 404 })

  const body = await req.json().catch(() => ({}))

  if (typeof body.active === "boolean" && !("name" in body)) {
    if (body.active) await setActiveSeason(id)
    else if (existing.active) await setActiveSeason(null)
    return NextResponse.json({ ok: true })
  }

  const result = validateSeason(body)
  if (result.error) return result.error

  const season = await db.season.update({ where: { id }, data: result.data })
  return NextResponse.json(season)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) return forbidden()

  const { id } = await params
  await db.season.deleteMany({ where: { id } })
  return NextResponse.json({ ok: true })
}
