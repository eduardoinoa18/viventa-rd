import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type Key = string

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt?: number
}

const localHits = new Map<Key, { count: number; resetAt: number }>()
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null
const limiterCache = new Map<string, Ratelimit>()

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null
  const key = `${limit}:${windowMs}`
  if (limiterCache.has(key)) {
    return limiterCache.get(key) || null
  }
  const seconds = Math.max(1, Math.ceil(windowMs / 1000))
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${seconds} s`),
    analytics: true,
    prefix: `viventa:rl:${limit}:${seconds}`,
  })
  limiterCache.set(key, limiter)
  return limiter
}

function localRateLimit(key: Key, limit = 20, windowMs = 60_000): RateLimitResult {
  const now = Date.now()
  const entry = localHits.get(key)
  if (!entry || now > entry.resetAt) {
    localHits.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: now + windowMs }
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count += 1
  return { allowed: true, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt }
}

export async function rateLimit(key: Key, limit = 20, windowMs = 60_000): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowMs)
  if (!limiter) {
    return localRateLimit(key, limit, windowMs)
  }

  try {
    const result = await limiter.limit(key)
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    }
  } catch {
    return localRateLimit(key, limit, windowMs)
  }
}

export function keyFromRequest(req: Request, extra?: string) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'unknown'
  const ua = req.headers.get('user-agent') || ''
  const path = new URL(req.url).pathname
  return `${ip}:${path}${extra ? ':' + extra : ''}:${ua.slice(0, 24)}`
}
