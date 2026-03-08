import { NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
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
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 50), 1), 200)

    const snap = await db
      .collection('office_crm_events')
      .where('officeId', '==', context.officeId)
      .orderBy('startAt', 'asc')
      .limit(limit)
      .get()

    const events = snap.docs.map((doc) => {
      const row = doc.data() as Record<string, any>
      return {
        id: doc.id,
        title: safeText(row.title),
        startAt: row.startAt?.toDate?.()?.toISOString?.() || null,
        endAt: row.endAt?.toDate?.()?.toISOString?.() || null,
        location: safeText(row.location),
        createdBy: safeText(row.createdBy),
      }
    })

    return NextResponse.json({ ok: true, events })
  } catch (error: any) {
    console.error('[api/broker/crm/events] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load CRM events' }, { status: 500 })
  }
}

export async function POST(req: Request) {
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
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const title = safeText(body.title)
    if (!title) return NextResponse.json({ ok: false, error: 'Title is required' }, { status: 400 })

    const startRaw = safeText(body.startAt)
    const endRaw = safeText(body.endAt)
    const startDate = new Date(startRaw)
    const endDate = new Date(endRaw)

    if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) {
      return NextResponse.json({ ok: false, error: 'startAt and endAt are required and must be valid' }, { status: 400 })
    }

    const now = Timestamp.now()
    const ref = await db.collection('office_crm_events').add({
      officeId: context.officeId,
      title,
      startAt: Timestamp.fromDate(startDate),
      endAt: Timestamp.fromDate(endDate),
      location: safeText(body.location),
      createdBy: context.uid,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ ok: true, id: ref.id })
  } catch (error: any) {
    console.error('[api/broker/crm/events] POST error', error)
    return NextResponse.json({ ok: false, error: 'Failed to create CRM event' }, { status: 500 })
  }
}
