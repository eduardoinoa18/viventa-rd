import { NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

/**
 * Agent Tasks API
 * Returns tasks from office_crm_tasks where assigneeUid === caller's uid.
 * Agents only see and manage tasks assigned to them.
 */
export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'agent' && context.role !== 'broker') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 100), 1), 200)
    const statusFilter = safeText(searchParams.get('status') || '')

    let snap: FirebaseFirestore.QuerySnapshot

    try {
      const q = db
        .collection('office_crm_tasks')
        .where('assigneeUid', '==', context.uid)
        .orderBy('createdAt', 'desc')
        .limit(limit)
      snap = await q.get()
    } catch {
      snap = await db
        .collection('office_crm_tasks')
        .where('assigneeUid', '==', context.uid)
        .limit(limit * 2)
        .get()
    }

    const rawDocs = snap.docs.map((doc) => {
      const row = doc.data() as Record<string, any>
      return {
        id: doc.id,
        title: safeText(row.title),
        dueAt: row.dueAt?.toDate?.()?.toISOString?.() || null,
        status: safeText(row.status || 'pending'),
        priority: safeText(row.priority || 'normal'),
        assigneeUid: safeText(row.assigneeUid),
        source: safeText(row.source || 'manual'),
        linkedTransactionId: safeText(row.linkedTransactionId || ''),
        officeId: safeText(row.officeId || ''),
        createdAt: row.createdAt?.toDate?.()?.getTime?.() || 0,
      }
    })

    let tasks = rawDocs
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map(({ createdAt, ...task }) => task)

    if (statusFilter && statusFilter !== 'all') {
      tasks = tasks.filter((t) => t.status === statusFilter)
    }

    return NextResponse.json({ ok: true, tasks })
  } catch (error: any) {
    console.error('[api/agent/tasks] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load agent tasks' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'agent' && context.role !== 'broker') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const title = safeText(body.title)
    if (!title) return NextResponse.json({ ok: false, error: 'Title is required' }, { status: 400 })

    const dueAtRaw = safeText(body.dueAt)
    const dueAtDate = dueAtRaw ? new Date(dueAtRaw) : null
    const dueAt = dueAtDate && Number.isFinite(dueAtDate.getTime()) ? Timestamp.fromDate(dueAtDate) : null

    const now = Timestamp.now()
    const ref = await db.collection('office_crm_tasks').add({
      officeId: context.officeId || '',
      title,
      dueAt,
      status: 'pending',
      priority: safeText(body.priority || 'normal').toLowerCase() || 'normal',
      assigneeUid: context.uid,
      createdBy: context.uid,
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ ok: true, id: ref.id })
  } catch (error: any) {
    console.error('[api/agent/tasks] POST error', error)
    return NextResponse.json({ ok: false, error: 'Failed to create task' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'agent' && context.role !== 'broker') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const id = safeText(body.id || body.taskId)
    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

    const taskRef = db.collection('office_crm_tasks').doc(id)
    const taskSnap = await taskRef.get()
    if (!taskSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Task not found' }, { status: 404 })
    }

    const taskData = taskSnap.data() as Record<string, any>
    // Agents can only update tasks assigned to them
    if (safeText(taskData.assigneeUid) !== context.uid) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const update: Record<string, any> = { updatedAt: Timestamp.now() }
    if (typeof body.status !== 'undefined') {
      update.status = safeText(body.status || 'pending').toLowerCase() || 'pending'
    }

    await taskRef.set(update, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[api/agent/tasks] PATCH error', error)
    return NextResponse.json({ ok: false, error: 'Failed to update task' }, { status: 500 })
  }
}
