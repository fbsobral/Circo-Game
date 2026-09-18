import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session || (role !== "professor" && role !== "admin")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { title, date, notes } = await req.json()
  const cls = await db.class.create({
    data: {
      title: title || null,
      date: date ? new Date(date) : new Date(),
      notes: notes || null,
      createdById: session.user.id,
    },
  })

  return NextResponse.json(cls)
}
