import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { cleanText } from "@/lib/security"
import { parseBirthDate } from "@/lib/birthdays"

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  if ("birthDate" in body) {
    const birthDate = parseBirthDate(body.birthDate)
    if (birthDate === undefined) return NextResponse.json({ error: "Data de nascimento inválida" }, { status: 400 })
    await db.user.update({ where: { id: session.user.id }, data: { birthDate } })
    return NextResponse.json({ ok: true })
  }

  const rawName = body.name
  const name = cleanText(rawName, 100)
  if (!name) return NextResponse.json({ error: "Nome obrigatório (até 100 caracteres)" }, { status: 400 })

  await db.user.update({ where: { id: session.user.id }, data: { name } })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const me = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (me?.role === "admin" && (await db.user.count({ where: { role: "admin" } })) <= 1) {
    return NextResponse.json({ error: "Você é o único administrador. Promova outra pessoa antes de excluir a conta." }, { status: 400 })
  }

  await db.user.delete({ where: { id: session.user.id } })
  return NextResponse.json({ ok: true })
}
