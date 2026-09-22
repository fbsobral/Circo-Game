import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { StarsForm } from "./stars-form"

export default async function EsteralasPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params
  const role = (session!.user as { role: string }).role

  if (role !== "professor" && role !== "admin") redirect(`/aulas/${id}`)

  const [cls, students, existingRecords] = await Promise.all([
    db.class.findUnique({ where: { id }, select: { id: true, title: true, date: true, notes: true } }),
    db.user.findMany({ where: { role: { in: ["student", "admin"] } }, select: { id: true, name: true, image: true }, orderBy: { name: "asc" } }),
    db.starRecord.findMany({ where: { classId: id }, select: { studentId: true, stars: true, note: true, absent: true } }),
  ])

  if (!cls) notFound()

  const recordMap: Record<string, { stars: number; note: string; absent: boolean }> = {}
  for (const r of existingRecords) {
    recordMap[r.studentId] = { stars: r.stars, note: r.note ?? "", absent: r.absent }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-cormorant)" }}>
          Editar registro
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {cls.title || "Aula"} · {formatDate(cls.date)}
        </p>
      </div>

      <StarsForm
        classId={id}
        students={students}
        initialRecords={recordMap}
        initialTitle={cls.title ?? ""}
        initialDate={cls.date.toISOString().slice(0, 10)}
        initialNotes={cls.notes ?? ""}
      />
    </div>
  )
}
