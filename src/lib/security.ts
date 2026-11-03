import { randomBytes, randomInt } from "crypto"

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function normalizeEmail(email: unknown): string {
  return String(email ?? "").trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= 8 && password.length <= 128
}

export function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  return Array.from({ length: 12 }, () => alphabet[randomInt(alphabet.length)]).join("")
}

export function generateToken(): string {
  return randomBytes(32).toString("hex")
}

const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/

export function isSafeImage(value: unknown, maxLength = 3_000_000): value is string {
  return typeof value === "string" && value.length <= maxLength && IMAGE_DATA_URL.test(value)
}

export function isSafeImageList(value: unknown, maxImages = 10, maxLength = 3_000_000): value is string {
  if (typeof value !== "string") return false
  const parts = value.split("|||")
  return parts.length <= maxImages && parts.every((p) => isSafeImage(p, maxLength))
}

export function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null
  const text = value.trim()
  return text.length > 0 && text.length <= maxLength ? text : null
}
