import { NextResponse } from "next/server"

// Clears NextAuth v5 session cookies and redirects to /login.
// Useful when large cookies prevent accessing the normal logout button.
export async function GET() {
  const base = process.env.NEXTAUTH_URL ?? "https://circo.felipesobral.com"
  const res = NextResponse.redirect(new URL("/login", base))
  const s = "Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure"
  const u = "Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
  // NextAuth v5 (authjs) names
  res.headers.append("Set-Cookie", `__Secure-authjs.session-token=; ${s}`)
  res.headers.append("Set-Cookie", `authjs.session-token=; ${u}`)
  res.headers.append("Set-Cookie", `__Secure-authjs.callback-url=; ${s}`)
  res.headers.append("Set-Cookie", `authjs.callback-url=; ${u}`)
  // Legacy NextAuth v4 names (just in case)
  res.headers.append("Set-Cookie", `__Secure-next-auth.session-token=; ${s}`)
  res.headers.append("Set-Cookie", `next-auth.session-token=; ${u}`)
  return res
}
