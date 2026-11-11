import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ContaClient } from "./conta-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Minha conta" }


export default async function ContaPage() {
  const session = await auth()
  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, name: true, email: true, image: true, password: true, birthDate: true },
  })
  const { password, birthDate, ...profile } = user!
  const googleLinked = !!(await db.account.findFirst({
    where: { userId: session!.user.id, provider: "google" },
  }))

  return (
    <ContaClient
      user={{ ...profile, hasPassword: !!password, birthDate: birthDate ? birthDate.toISOString().slice(0, 10) : "" }}
      googleLinked={googleLinked}
    />
  )
}
