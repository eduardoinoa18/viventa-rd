import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function safeLower(value: unknown): string {
  return safeText(value).toLowerCase()
}

function toMillis(value: any): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return date instanceof Date ? date.getTime() : 0
  }
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0
}

function toIso(value: any): string | null {
  const ms = toMillis(value)
  return ms ? new Date(ms).toISOString() : null
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'constructora') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const scopedCode = safeText(context.constructoraCode || context.professionalCode || context.uid)
    const { searchParams } = new URL(req.url)
    const q = safeLower(searchParams.get('q') || '')

    // Fetch deals for this constructora
    const dealsSnap = await db
      .collection('deals')
      .where('constructoraCode', '==', scopedCode)
      .limit(2000)
      .get()

    const nowMs = Date.now()
    const seen = new Set<string>()
    const clients: Array<{
      id: string
      name: string
      email: string
      phone: string
      source: 'deal' | 'reservation'
      projectName: string
      unitId: string
      dealStatus: string
      createdAt: string | null
    }> = []

    for (const doc of dealsSnap.docs) {
      const data = doc.data() as Record<string, any>
      const buyerId = safeText(data.buyerId)
      const email = safeLower(data.buyerEmail || '')
      const dedupeKey = buyerId || email || doc.id

      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)

      clients.push({
        id: doc.id,
        name: safeText(data.buyerName || data.buyerFullName || 'Cliente'),
        email,
        phone: safeText(data.buyerPhone || ''),
        source: 'deal',
        projectName: safeText(data.projectName || data.projectId || ''),
        unitId: safeText(data.unitId || ''),
        dealStatus: safeLower(data.status || 'reserved'),
        createdAt: toIso(data.createdAt),
      })
    }

    // Apply search filter
    let filtered = clients
    if (q) {
      filtered = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.includes(q) ||
          c.phone.includes(q) ||
          c.projectName.toLowerCase().includes(q),
      )
    }

    filtered.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))

    const total = clients.length
    const active = clients.filter((c) => !['closed', 'cancelled', 'rejected'].includes(c.dealStatus)).length
    const newClients = dealsSnap.docs.filter((doc) => {
      const data = doc.data() as Record<string, any>
      return toMillis(data.createdAt) >= nowMs - THIRTY_DAYS_MS
    }).length

    return NextResponse.json({
      ok: true,
      summary: { total, active, new: newClients },
      clients: filtered.slice(0, 200),
    })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/clients] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load constructora clients' }, { status: 500 })
  }
}
