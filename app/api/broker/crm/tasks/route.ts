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
      .collection('office_crm_tasks')
      .where('officeId', '==', context.officeId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    const tasks = snap.docs.map((doc) => {
      const row = doc.data() as Record<string, any>
      return {
        id: doc.id,
        title: safeText(row.title),
        dueAt: row.dueAt?.toDate?.()?.toISOString?.() || null,
        status: safeText(row.status || 'open'),
        priority: safeText(row.priority || 'normal'),
        assigneeUid: safeText(row.assigneeUid),
        createdBy: safeText(row.createdBy),
      }
    })

    return NextResponse.json({ ok: true, tasks })
  } catch (error: any) {
    console.error('[api/broker/crm/tasks] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load CRM tasks' }, { status: 500 })
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

    const dueAtRaw = safeText(body.dueAt)
    const dueAtDate = dueAtRaw ? new Date(dueAtRaw) : null
    const dueAt = dueAtDate && Number.isFinite(dueAtDate.getTime()) ? Timestamp.fromDate(dueAtDate) : null

    const now = Timestamp.now()
    const ref = await db.collection('office_crm_tasks').add({
      officeId: context.officeId,
      title,
      dueAt,
      status: safeText(body.status || 'open').toLowerCase() || 'open',
      priority: safeText(body.priority || 'normal').toLowerCase() || 'normal',
      assigneeUid: safeText(body.assigneeUid || context.uid),
      createdBy: context.uid,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ ok: true, id: ref.id })
  } catch (error: any) {
    console.error('[api/broker/crm/tasks] POST error', error)
    return NextResponse.json({ ok: false, error: 'Failed to create CRM task' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
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
    const id = safeText(body.id)
    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

    const update: Record<string, any> = {
      updatedAt: Timestamp.now(),
    }

    if (typeof body.status !== 'undefined') {
      update.status = safeText(body.status || 'open').toLowerCase() || 'open'
    }

    await db.collection('office_crm_tasks').doc(id).set(update, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[api/broker/crm/tasks] PATCH error', error)
    return NextResponse.json({ ok: false, error: 'Failed to update CRM task' }, { status: 500 })
  }
}
