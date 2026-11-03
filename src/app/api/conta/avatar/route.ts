import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isSafeImage } from "@/lib/security"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { imageUrl } = await req.json().catch(() => ({}))
  if (!isSafeImage(imageUrl, 1_000_000)) return NextResponse.json({ error: "Imagem inválida ou grande demais" }, { status: 400 })

  await db.user.update({ where: { id: session.user.id }, data: { image: imageUrl } })
  return NextResponse.json({ ok: true })
}
