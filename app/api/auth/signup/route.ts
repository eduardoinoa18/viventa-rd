import { NextRequest, NextResponse } from 'next/server'
import { keyFromRequest, rateLimit } from '@/lib/rateLimiter'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const rl = await rateLimit(keyFromRequest(req, email), 5, 60_000)
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: 'Demasiados intentos. Intenta más tarde.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { ok: false, error: 'Registro temporalmente no disponible desde esta ruta.' },
      { status: 501 }
    )
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
