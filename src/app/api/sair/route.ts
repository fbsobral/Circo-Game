import { NextResponse } from "next/server"

// Clears NextAuth session cookies and redirects to /login.
// Useful when the 431 error prevents accessing the normal logout button.
export async function GET() {
  const res = NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL ?? "https://ipesobral.com"))
  const cookieOptions = "Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure"
  res.headers.append("Set-Cookie", `__Secure-next-auth.session-token=; ${cookieOptions}`)
  res.headers.append("Set-Cookie", `next-auth.session-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`)
  res.headers.append("Set-Cookie", `__Secure-next-auth.csrf-token=; ${cookieOptions}`)
  res.headers.append("Set-Cookie", `next-auth.csrf-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`)
  res.headers.append("Set-Cookie", `__Host-next-auth.csrf-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`)
  res.headers.append("Set-Cookie", `next-auth.callback-url=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`)
  res.headers.append("Set-Cookie", `__Secure-next-auth.callback-url=; ${cookieOptions}`)
  return res
}
