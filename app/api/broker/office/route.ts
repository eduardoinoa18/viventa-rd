import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function toIso(value: any): string | null {
  if (!value) return null
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return date instanceof Date ? date.toISOString() : null
  }
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null
}

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker' && context.role !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    if (!context.officeId) {
      return NextResponse.json({ ok: false, error: 'Office assignment required' }, { status: 403 })
    }

    const snap = await db.collection('broker_offices').doc(context.officeId).get()
    if (!snap.exists) {
      return NextResponse.json({ ok: true, office: null })
    }

    const data = snap.data() as Record<string, any>

    return NextResponse.json({
      ok: true,
      office: {
        id: snap.id,
        name: safeText(data.name),
        officeCode: safeText(data.officeCode || snap.id),
        brokerageName: safeText(data.brokerageName),
        city: safeText(data.city),
        province: safeText(data.province),
        status: safeText(data.status || 'active').toLowerCase() || 'active',
        subscription: {
          plan: safeText(data.subscription?.plan || 'basic').toLowerCase() || 'basic',
          status: safeText(data.subscription?.status || 'active').toLowerCase() || 'active',
          agentsLimit: Number(data.subscription?.agentsLimit || 25),
          listingsLimit: Number(data.subscription?.listingsLimit || 250),
          seatsUsed: Number(data.subscription?.seatsUsed || 0),
          currentPeriodEnd: toIso(data.subscription?.currentPeriodEnd),
        },
      },
    })
  } catch (error: any) {
    console.error('[api/broker/office] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load office profile' }, { status: 500 })
  }
}
