import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { forbidden, requireAdmin, validateSeason } from "../validate"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return forbidden()

  const { id } = await params
  const existing = await db.season.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Temporada não encontrada" }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const result = await validateSeason(body, id)
  if (result.error) return result.error

  const season = await db.season.update({ where: { id }, data: result.data })
  return NextResponse.json(season)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return forbidden()

  const { id } = await params
  await db.season.deleteMany({ where: { id } })
  return NextResponse.json({ ok: true })
}
