const PRODUCTION_FALLBACK_URL = 'https://viventa-rd.com'

function normalizeUrl(value?: string | null): string | null {
  if (!value) return null

  const trimmed = String(value).trim()
  if (!trimmed) return null

  const candidate = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`

  try {
    const parsed = new URL(candidate)
    const host = parsed.hostname.toLowerCase()

    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
      return null
    }

    return parsed.origin
  } catch {
    return null
  }
}

export function getPublicAppUrl(): string {
  return (
    normalizeUrl(process.env.NEXT_PUBLIC_BASE_URL) ||
    normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeUrl(process.env.VERCEL_URL) ||
    PRODUCTION_FALLBACK_URL
  )
}
