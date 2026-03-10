import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import { DEAL_EVENT_TYPES } from '@/lib/domain/deal'

export const dynamic = 'force-dynamic'

const ALLOWED_EVENT_TYPES = DEAL_EVENT_TYPES

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

type DealEvent = Record<string, any> & {
  id: string
  dealId: string
  createdAt?: unknown
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'constructora') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const dealRef = db.collection('deals').doc(params.id)
    const dealSnap = await dealRef.get()
    if (!dealSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Deal not found' }, { status: 404 })
    }

    const scopedCode = safeText(context.constructoraCode || context.professionalCode || context.uid)
    const dealData = dealSnap.data() as Record<string, any>
    if (safeText(dealData.constructoraCode) !== scopedCode) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const eventsSnap = await dealRef.collection('events').limit(400).get()
    const events: DealEvent[] = eventsSnap.docs
      .map((doc): DealEvent => ({ id: doc.id, dealId: params.id, ...(doc.data() as Record<string, any>) }))
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))

    return NextResponse.json({ ok: true, events })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/deals/[id]/events] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load deal events' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'constructora') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const dealRef = db.collection('deals').doc(params.id)
    const dealSnap = await dealRef.get()
    if (!dealSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Deal not found' }, { status: 404 })
    }

    const scopedCode = safeText(context.constructoraCode || context.professionalCode || context.uid)
    const dealData = dealSnap.data() as Record<string, any>
    if (safeText(dealData.constructoraCode) !== scopedCode) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const type = safeLower(body.type)
    if (!(ALLOWED_EVENT_TYPES as readonly string[]).includes(type)) {
      return NextResponse.json({ ok: false, error: 'Invalid event type' }, { status: 400 })
    }

    const created = await dealRef.collection('events').add({
      type,
      actorId: context.uid,
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
      createdAt: new Date(),
    })

    const saved = await created.get()
    return NextResponse.json({ ok: true, event: { id: created.id, ...(saved.data() || {}) } }, { status: 201 })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/deals/[id]/events] POST error', error)
    return NextResponse.json({ ok: false, error: 'Failed to create deal event' }, { status: 500 })
  }
}
