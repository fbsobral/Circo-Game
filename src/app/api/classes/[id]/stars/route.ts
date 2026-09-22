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
    records: { studentId: string; stars: number; note?: string; absent?: boolean }[]
  }

  const cls = await db.class.findUnique({ where: { id: classId } })
  if (!cls) return NextResponse.json({ error: "Aula não encontrada" }, { status: 404 })

  // Remove records for students no longer included in this class
  const includedIds = records.map((r) => r.studentId)
  await db.starRecord.deleteMany({
    where: { classId, studentId: { notIn: includedIds } },
  })

  const results = await Promise.all(
    records.map(({ studentId, stars, note, absent }) =>
      db.starRecord.upsert({
        where: { classId_studentId: { classId, studentId } },
        create: { classId, studentId, stars: absent ? 0 : stars, absent: absent ?? false, note: absent ? null : note || null, recordedById: session.user.id },
        update: { stars: absent ? 0 : stars, absent: absent ?? false, note: absent ? null : note || null, recordedById: session.user.id },
        include: { student: true },
      })
    )
  )

  // Send email only for present students with stars
  Promise.all(
    results.map(async (record) => {
      if (record.absent || record.stars === 0) return
      if (!record.student.email) return
      const total = await db.starRecord.aggregate({
        where: { studentId: record.studentId, absent: false },
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
