import type { Metadata } from "next"
import { Cormorant_Garamond, Inter } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: { default: "Circo | Game", template: "%s | Circo Game" },
  description: "Gamificação para turmas de circo",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎪</text></svg>" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${inter.variable}`}>
      <body><Providers>{children}</Providers></body>
    </html>
  )
}
