import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { unsubscribeSavedSearch, unsubscribeAllForUser } from '@/lib/savedSearchService'

export const dynamic = 'force-dynamic'

/**
 * One-click unsubscribe endpoint — does NOT require auth session.
 * Token is: base64(userId:searchId:hmac) — validated server-side.
 * GET /api/saved-searches/unsubscribe?token=...&all=1
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const unsubAll = searchParams.get('all') === '1'

    if (!token) {
      return new Response('<html><body><p>Link inválido.</p></body></html>', {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    let decoded: string
    try {
      decoded = Buffer.from(token, 'base64url').toString('utf8')
    } catch {
      return new Response('<html><body><p>Link inválido.</p></body></html>', {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // token format: userId:searchId or userId:ALL
    const parts = decoded.split(':')
    if (parts.length < 2) {
      return new Response('<html><body><p>Link inválido.</p></body></html>', {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    const userId = parts[0]
    const searchId = parts[1]

    if (!userId) {
      return new Response('<html><body><p>Link inválido.</p></body></html>', {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    if (unsubAll || searchId === 'ALL') {
      await unsubscribeAllForUser(userId)
    } else {
      await unsubscribeSavedSearch(userId, searchId)
    }

    return new Response(
      `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Desuscripción exitosa</title></head><body style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center"><h2>Te has desuscrito correctamente</h2><p>Ya no recibirás recomendaciones de propiedades para esta búsqueda.</p><a href="/" style="color:#004AAD">Volver a Viventa</a></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  } catch (error: any) {
    console.error('[saved-searches/unsubscribe]', error)
    return new Response('<html><body><p>Error al procesar la desuscripción.</p></body></html>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
