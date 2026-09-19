import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const users = await db.user.findMany({
    select: { id: true, name: true, image: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(users)
}
