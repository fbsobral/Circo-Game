import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session || (role !== "professor" && role !== "admin")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { title, date, notes } = await req.json().catch(() => ({}))
  if ((typeof title === "string" && title.length > 150) || (typeof notes === "string" && notes.length > 2000)) {
    return NextResponse.json({ error: "Título (até 150) ou observação (até 2000) muito longos" }, { status: 400 })
  }
  if (date && Number.isNaN(new Date(date).getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 })
  }
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
