import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const isProfessorOrAdmin = role === "professor" || role === "admin"
  if (!session || !isProfessorOrAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { name, email, userRole } = await req.json()
  if (!name || !email) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios" }, { status: 400 })
  }
  if (!["admin", "professor", "student"].includes(userRole ?? "student")) {
    return NextResponse.json({ error: "Papel inválido" }, { status: 400 })
  }
  if (userRole === "admin" && role !== "admin") {
    return NextResponse.json({ error: "Somente admins podem criar outros admins" }, { status: 403 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 })
  }

  const tempPassword = Math.random().toString(36).slice(2, 6).toUpperCase() + Math.random().toString(36).slice(2, 6)
  const hash = await bcrypt.hash(tempPassword, 12)
  const user = await db.user.create({
    data: { name, email, password: hash, role: userRole ?? "student", mustChangePassword: true },
    select: { id: true, name: true, email: true, role: true, image: true, createdAt: true },
  })

  const loginUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/login`
  sendWelcomeEmail(email, name, loginUrl, tempPassword).catch(() => {})

  return NextResponse.json(user)
}

export async function GET() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const isProfessorOrAdmin = role === "professor" || role === "admin"
  if (!session || !isProfessorOrAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, image: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(users)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const isProfessorOrAdmin = role === "professor" || role === "admin"
  if (!session || !isProfessorOrAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const body = await req.json()

  // Edit name/email
  if (body.action === "edit") {
    const { userId, name, email } = body
    if (!name || !email) return NextResponse.json({ error: "Nome e e-mail obrigatórios" }, { status: 400 })
    const conflict = await db.user.findFirst({ where: { email, NOT: { id: userId } } })
    if (conflict) return NextResponse.json({ error: "E-mail já em uso" }, { status: 409 })
    const user = await db.user.update({
      where: { id: userId },
      data: { name, email },
      select: { id: true, name: true, email: true, role: true, image: true, createdAt: true },
    })
    return NextResponse.json(user)
  }

  const { userId, newRole } = body
  if (!["admin", "professor", "student"].includes(newRole)) {
    return NextResponse.json({ error: "Papel inválido" }, { status: 400 })
  }

  const user = await db.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: { id: true, name: true, email: true, role: true },
  })
  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session || role !== "admin") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { userId } = await req.json()
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Não é possível remover a si mesmo" }, { status: 400 })
  }

  await db.user.delete({ where: { id: userId } })
  return NextResponse.json({ ok: true })
}
