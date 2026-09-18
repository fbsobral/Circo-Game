import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ContaClient } from "./conta-client"

export default async function ContaPage() {
  const session = await auth()
  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, name: true, email: true, image: true, password: true },
  })
  const googleLinked = !!(await db.account.findFirst({
    where: { userId: session!.user.id, provider: "google" },
  }))

  return (
    <ContaClient
      user={{ ...user!, hasPassword: !!user?.password }}
      googleLinked={googleLinked}
    />
  )
}
