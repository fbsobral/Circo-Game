import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createNotification } from "@/lib/notifications"
import { sendClassReviewEmail } from "@/lib/email"
import { formatDateShort } from "@/lib/utils"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id: classId } = await params
  const userId = session.user.id
  const { stars, comment } = await req.json()

  if (!Number.isInteger(stars) || stars < 1 || stars > 3) {
    return NextResponse.json({ error: "Escolha de 1 a 3 estrelas" }, { status: 400 })
  }
  const text = typeof comment === "string" ? comment.trim() : ""
  if (text.length > 1000) return NextResponse.json({ error: "Comentário muito longo (máx. 1000)" }, { status: 400 })

  const cls = await db.class.findUnique({
    where: { id: classId },
    select: { id: true, title: true, date: true, createdBy: { select: { id: true, name: true, email: true } } },
  })
  if (!cls) return NextResponse.json({ error: "Aula não encontrada" }, { status: 404 })

  const attended = await db.starRecord.findFirst({ where: { classId, studentId: userId, absent: false }, select: { id: true } })
  if (!attended) return NextResponse.json({ error: "Só quem participou da aula pode avaliá-la" }, { status: 403 })

  const existing = await db.classReview.findUnique({
    where: { classId_studentId: { classId, studentId: userId } },
    select: { id: true },
  })

  const review = await db.classReview.upsert({
    where: { classId_studentId: { classId, studentId: userId } },
    create: { classId, studentId: userId, stars, comment: text || null },
    update: { stars, comment: text || null },
  })

  if (!existing && cls.createdBy.id !== userId) {
    const baseUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`
    const classUrl = `${baseUrl}/aulas/${classId}`
    const studentName = session.user.name ?? "Um aluno"
    const classTitle = cls.title || "Aula"
    const preview = text ? (text.length > 200 ? text.slice(0, 200) + "…" : text) : ""

    createNotification({
      userId: cls.createdBy.id,
      type: "review",
      title: `${studentName} avaliou a aula ${classTitle} com ${stars}★`,
      body: preview || "Sem comentário",
      url: classUrl,
    }).catch(() => {})

    if (cls.createdBy.email) {
      sendClassReviewEmail(
        cls.createdBy.email,
        cls.createdBy.name ?? "Professor",
        studentName,
        classTitle,
        formatDateShort(cls.date),
        stars,
        text || null,
        classUrl,
      ).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, stars: review.stars, comment: review.comment, created: !existing })
}
