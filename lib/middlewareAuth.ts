// lib/middlewareAuth.ts
// NOTE: Next.js middleware runs on the Edge runtime and cannot use firebase-admin.
// This helper proxies auth verification to a Node runtime API route.
import { NextRequest } from 'next/server'

type InitAuthOk = { ok: true; user: { uid: string; role?: string; email?: string | null } }
type InitAuthErr = { ok: false; error: string }

export async function initAuth(req: NextRequest): Promise<InitAuthOk | InitAuthErr> {
  try {
    const url = new URL('/api/auth/verify', req.nextUrl)
    const headers: Record<string, string> = {}

    // Forward Authorization header (if any)
    const authHeader = req.headers.get('authorization')
    if (authHeader) headers['authorization'] = authHeader

    // Forward cookies for session cookie verification
    const cookieHeader = req.headers.get('cookie')
    if (cookieHeader) headers['cookie'] = cookieHeader

    const res = await fetch(url, { headers, method: 'GET', cache: 'no-store' })
    if (!res.ok) return { ok: false, error: `verify-${res.status}` }
    const data = (await res.json()) as InitAuthOk | InitAuthErr
    return data
  } catch (err: any) {
    return { ok: false, error: err?.message || 'verify-failed' }
  }
}
