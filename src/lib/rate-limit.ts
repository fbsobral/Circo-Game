const hits = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)

  if (recent.length >= limit) {
    hits.set(key, recent)
    return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000)) }
  }

  recent.push(now)
  hits.set(key, recent)

  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k)
    }
  }
  return { ok: true, retryAfter: 0 }
}

// The rightmost X-Forwarded-For entry is the one appended by our own reverse proxy;
// earlier entries can be forged by the client.
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]
  }
  return req.headers.get("x-real-ip") ?? "unknown"
}

export function tooManyRequests(retryAfter: number) {
  return Response.json(
    { error: "Muitas tentativas. Aguarde um pouco e tente novamente." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  )
}
