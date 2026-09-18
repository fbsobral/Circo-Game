import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { imageUrl } = await req.json()
  if (!imageUrl) return NextResponse.json({ error: "Imagem obrigatória" }, { status: 400 })

  await db.user.update({ where: { id: session.user.id }, data: { image: imageUrl } })
  return NextResponse.json({ ok: true })
}
