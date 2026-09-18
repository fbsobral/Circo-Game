import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"

export const dynamic = "force-dynamic"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen">
      <Navbar role={(session.user as { role: string }).role} name={session.user.name} />
      <main className="mx-auto max-w-5xl px-4 py-6 md:py-8 pb-24 md:pb-8">{children}</main>
    </div>
  )
}
