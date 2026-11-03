import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email"
import { cleanText, generateTempPassword, isValidEmail, isValidPassword, normalizeEmail } from "@/lib/security"

const ROLES = ["admin", "professor", "student"]
const USER_SELECT = { id: true, name: true, email: true, role: true, image: true, createdAt: true, mustChangePassword: true, weeklyFrequency: true } as const

async function getActor() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session || (role !== "professor" && role !== "admin")) return null
  return { id: session.user.id, role }
}

const forbidden = () => NextResponse.json({ error: "Não autorizado" }, { status: 403 })
const adminOnlyTarget = () => NextResponse.json({ error: "Somente administradores podem alterar administradores" }, { status: 403 })

async function wouldRemoveLastAdmin(targetId: string, newRole: string) {
  const target = await db.user.findUnique({ where: { id: targetId }, select: { role: true } })
  if (target?.role !== "admin" || newRole === "admin") return false
  return (await db.user.count({ where: { role: "admin" } })) <= 1
}

export async function POST(req: NextRequest) {
  const actor = await getActor()
  if (!actor) return forbidden()

  const body = await req.json().catch(() => ({}))
  const name = cleanText(body.name, 100)
  const email = normalizeEmail(body.email)
  const userRole = body.userRole ?? "student"
  if (!name || !isValidEmail(email)) {
    return NextResponse.json({ error: "Informe um nome e um e-mail válidos" }, { status: 400 })
  }
  if (!ROLES.includes(userRole)) return NextResponse.json({ error: "Papel inválido" }, { status: 400 })
  if (userRole === "admin" && actor.role !== "admin") {
    return NextResponse.json({ error: "Somente admins podem criar outros admins" }, { status: 403 })
  }

  const existing = await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })
  if (existing) return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 })

  const tempPassword = generateTempPassword()
  const hash = await bcrypt.hash(tempPassword, 12)
  const user = await db.user.create({
    data: { name, email, password: hash, role: userRole, mustChangePassword: true },
    select: { id: true, name: true, email: true, role: true, image: true, createdAt: true },
  })

  const loginUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/login`
  sendWelcomeEmail(email, name, loginUrl, tempPassword).catch(() => {})

  return NextResponse.json(user)
}

export async function GET() {
  const actor = await getActor()
  if (!actor) return forbidden()

  const users = await db.user.findMany({ select: USER_SELECT, orderBy: { createdAt: "asc" } })
  return NextResponse.json(users)
}

export async function PATCH(req: NextRequest) {
  const actor = await getActor()
  if (!actor) return forbidden()

  const body = await req.json().catch(() => ({}))
  const userId = typeof body.userId === "string" ? body.userId : ""
  const target = userId ? await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true } }) : null
  if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  // Professors can never touch an administrator account.
  if (target.role === "admin" && actor.role !== "admin") return adminOnlyTarget()

  if (body.action === "edit") {
    const name = cleanText(body.name, 100)
    const email = normalizeEmail(body.email)
    if (!name || !isValidEmail(email)) {
      return NextResponse.json({ error: "Informe um nome e um e-mail válidos" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { name, email }

    if (body.userRole !== undefined && body.userRole !== target.role) {
      if (!ROLES.includes(body.userRole)) return NextResponse.json({ error: "Papel inválido" }, { status: 400 })
      if (body.userRole === "admin" && actor.role !== "admin") {
        return NextResponse.json({ error: "Somente admins podem definir role admin" }, { status: 403 })
      }
      if (target.id === actor.id || (await wouldRemoveLastAdmin(target.id, body.userRole))) {
        return NextResponse.json({ error: "Não é possível rebaixar o único administrador (ou a si mesmo)" }, { status: 400 })
      }
      updateData.role = body.userRole
    }

    const conflict = await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" }, NOT: { id: target.id } } })
    if (conflict) return NextResponse.json({ error: "E-mail já em uso" }, { status: 409 })

    if (body.weeklyFrequency === 1 || body.weeklyFrequency === 2) updateData.weeklyFrequency = body.weeklyFrequency

    if (body.newPassword) {
      if (!isValidPassword(body.newPassword)) {
        return NextResponse.json({ error: "A senha deve ter entre 8 e 128 caracteres" }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(body.newPassword, 12)
      updateData.mustChangePassword = false
    }

    const user = await db.user.update({ where: { id: target.id }, data: updateData, select: USER_SELECT })
    if (updateData.password) await db.session.deleteMany({ where: { userId: target.id } })
    return NextResponse.json(user)
  }

  if (body.action === "resendEmail") {
    if (!target.email) return NextResponse.json({ error: "Usuário sem e-mail" }, { status: 404 })
    const tempPassword = generateTempPassword()
    const hash = await bcrypt.hash(tempPassword, 12)
    await db.user.update({ where: { id: target.id }, data: { password: hash, mustChangePassword: true } })
    await db.session.deleteMany({ where: { userId: target.id } })
    const loginUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/login`
    sendWelcomeEmail(target.email, target.name ?? "", loginUrl, tempPassword).catch(() => {})
    return NextResponse.json({ ok: true })
  }

  // Promote / demote: administrators only.
  if (actor.role !== "admin") return forbidden()
  const newRole = body.newRole
  if (!ROLES.includes(newRole)) return NextResponse.json({ error: "Papel inválido" }, { status: 400 })
  if (newRole !== target.role && (target.id === actor.id || (await wouldRemoveLastAdmin(target.id, newRole)))) {
    return NextResponse.json({ error: "Não é possível rebaixar o único administrador (ou a si mesmo)" }, { status: 400 })
  }

  const user = await db.user.update({
    where: { id: target.id },
    data: { role: newRole },
    select: { id: true, name: true, email: true, role: true },
  })
  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest) {
  const actor = await getActor()
  if (!actor || actor.role !== "admin") return forbidden()

  const { userId } = await req.json().catch(() => ({}))
  if (typeof userId !== "string" || !userId) return NextResponse.json({ error: "Usuário inválido" }, { status: 400 })
  if (userId === actor.id) return NextResponse.json({ error: "Não é possível remover a si mesmo" }, { status: 400 })

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  if (target.role === "admin" && (await db.user.count({ where: { role: "admin" } })) <= 1) {
    return NextResponse.json({ error: "Não é possível remover o único administrador" }, { status: 400 })
  }

  await db.user.delete({ where: { id: userId } })
  return NextResponse.json({ ok: true })
}
