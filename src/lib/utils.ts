import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date))
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date))
}

export const BADGES = [
  { threshold: 3, name: "Primeiro Passo", emoji: "🌱", description: "3 estrelas" },
  { threshold: 10, name: "Equilibrista", emoji: "⚖️", description: "10 estrelas" },
  { threshold: 25, name: "Malabarista", emoji: "🤹", description: "25 estrelas" },
  { threshold: 50, name: "Acrobata", emoji: "🤸", description: "50 estrelas" },
  { threshold: 100, name: "Trapezista", emoji: "🎪", description: "100 estrelas" },
  { threshold: 200, name: "Virtuoso", emoji: "✨", description: "200 estrelas" },
  { threshold: 500, name: "Lenda do Circo", emoji: "👑", description: "500 estrelas" },
]

export function getEarnedBadges(totalStars: number) {
  return BADGES.filter((b) => totalStars >= b.threshold)
}

export function getNextBadge(totalStars: number) {
  return BADGES.find((b) => totalStars < b.threshold) ?? null
}
