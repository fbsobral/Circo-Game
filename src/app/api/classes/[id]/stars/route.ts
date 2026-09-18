import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendStarsNotificationEmail } from "@/lib/email"
import { formatDateShort } from "@/lib/utils"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session || (role !== "professor" && role !== "admin")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { id: classId } = await params
  const { records } = await req.json() as {
    records: { studentId: string; stars: number; note?: string }[]
  }

  const cls = await db.class.findUnique({ where: { id: classId } })
  if (!cls) return NextResponse.json({ error: "Aula não encontrada" }, { status: 404 })

  const results = await Promise.all(
    records.map(({ studentId, stars, note }) =>
      db.starRecord.upsert({
        where: { classId_studentId: { classId, studentId } },
        create: { classId, studentId, stars, note: note || null, recordedById: session.user.id },
        update: { stars, note: note || null, recordedById: session.user.id },
        include: { student: true },
      })
    )
  )

  // Send email notifications in background (don't await to avoid slow response)
  Promise.all(
    results.map(async (record) => {
      if (!record.student.email) return
      const total = await db.starRecord.aggregate({
        where: { studentId: record.studentId },
        _sum: { stars: true },
      })
      try {
        await sendStarsNotificationEmail(
          record.student.email,
          record.student.name ?? "Aluno",
          cls.title ?? "",
          formatDateShort(cls.date),
          record.stars,
          record.note,
          total._sum.stars ?? 0,
        )
      } catch {
        // log but don't fail
      }
    })
  )

  return NextResponse.json({ ok: true, count: results.length })
}
