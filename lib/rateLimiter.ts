type Key = string

const hits = new Map<Key, { count: number; resetAt: number }>()

export function rateLimit(key: Key, limit = 20, windowMs = 60_000) {
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count += 1
  return { allowed: true, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt }
}

export function keyFromRequest(req: Request, extra?: string) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'unknown'
  const ua = req.headers.get('user-agent') || ''
  const path = new URL(req.url).pathname
  return `${ip}:${path}${extra ? ':' + extra : ''}:${ua.slice(0, 24)}`
}
