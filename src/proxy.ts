import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isPublic = pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/api/reset-password") || pathname.startsWith("/reset-password") || pathname.startsWith("/forgot-password") || pathname === "/trocar-senha" || pathname === "/api/change-password"

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/feed", req.url))
  }

  if (session && (pathname === "/" || pathname === "/dashboard")) {
    return NextResponse.redirect(new URL("/feed", req.url))
  }

  const role = (session?.user as { role?: string })?.role
  const isProfessorOrAdmin = role === "professor" || role === "admin"
  const isAdmin = role === "admin"

  const mustChangePassword = (session?.user as { mustChangePassword?: boolean })?.mustChangePassword
  if (session && mustChangePassword && pathname !== "/trocar-senha" && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/trocar-senha", req.url))
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/feed", req.url))
  }

  if ((pathname.startsWith("/aulas/nova") || pathname.endsWith("/estrelas") || pathname.startsWith("/usuarios")) && !isProfessorOrAdmin) {
    return NextResponse.redirect(new URL("/aulas", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
