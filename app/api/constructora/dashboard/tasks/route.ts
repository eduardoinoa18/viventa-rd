import { NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
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

function toIso(value: any): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return date instanceof Date ? date.toISOString() : null
  }
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null
}

function resolveScopedCode(context: { uid: string; constructoraCode: string; professionalCode: string }) {
  return safeText(context.constructoraCode || context.professionalCode || context.uid)
}

function asTask(id: string, data: Record<string, any>) {
  return {
    id,
    title: safeText(data.title),
    dueAt: toIso(data.dueAt),
    status: safeLower(data.status || 'pending') || 'pending',
    priority: safeLower(data.priority || 'normal') || 'normal',
    assigneeUid: safeText(data.assigneeUid),
    createdBy: safeText(data.createdBy),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    linkedDealId: safeText(data.linkedDealId),
    source: safeText(data.source || 'manual'),
  }
}

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

    const scopedCode = resolveScopedCode(context)
    const { searchParams } = new URL(req.url)
    const statusFilter = safeLower(searchParams.get('status') || 'all')
    const q = safeLower(searchParams.get('q') || '')
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 100), 1), 300)

    let snap: FirebaseFirestore.QuerySnapshot
    try {
      snap = await db
        .collection('constructora_crm_tasks')
        .where('constructoraCode', '==', scopedCode)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get()
    } catch {
      snap = await db
        .collection('constructora_crm_tasks')
        .where('constructoraCode', '==', scopedCode)
        .limit(Math.min(limit * 4, 300))
        .get()
    }

    let tasks = snap.docs.map((doc) => asTask(doc.id, doc.data() as Record<string, any>))
    if (statusFilter !== 'all') {
      tasks = tasks.filter((task) => task.status === statusFilter)
    }
    if (q) {
      tasks = tasks.filter((task) => safeLower(task.title).includes(q) || safeLower(task.linkedDealId).includes(q))
    }

    tasks = tasks
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, limit)

    // Resolve assignee display names in bulk
    const assigneeUids = Array.from(new Set(tasks.map((t) => t.assigneeUid).filter(Boolean)))
    const nameMap: Record<string, string> = {}
    if (assigneeUids.length > 0) {
      try {
        const userSnaps = await Promise.all(assigneeUids.map((uid) => db.collection('users').doc(uid).get()))
        for (const userSnap of userSnaps) {
          if (userSnap.exists) {
            const u = userSnap.data() as Record<string, any>
            nameMap[userSnap.id] = safeText(u.displayName || u.name || u.email || userSnap.id.slice(0, 8))
          }
        }
      } catch {
        // best-effort; fall back to uid prefix
      }
    }

    const enrichedTasks = tasks.map((t) => ({
      ...t,
      assigneeName: nameMap[t.assigneeUid] || (t.assigneeUid ? t.assigneeUid.slice(0, 8) : ''),
    }))

    return NextResponse.json({ ok: true, tasks: enrichedTasks })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/tasks] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load constructora tasks' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'constructora') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const title = safeText(body.title)
    if (!title) return NextResponse.json({ ok: false, error: 'Title is required' }, { status: 400 })

    const scopedCode = resolveScopedCode(context)
    const linkedDealId = safeText(body.linkedDealId)
    if (linkedDealId) {
      const dealSnap = await db.collection('deals').doc(linkedDealId).get()
      if (!dealSnap.exists) {
        return NextResponse.json({ ok: false, error: 'Linked deal not found' }, { status: 404 })
      }
      const dealData = dealSnap.data() as Record<string, any>
      if (safeText(dealData.constructoraCode) !== scopedCode) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
      }
    }

    const dueAtRaw = safeText(body.dueAt)
    const dueAtDate = dueAtRaw ? new Date(dueAtRaw) : null
    const dueAt = dueAtDate && Number.isFinite(dueAtDate.getTime()) ? Timestamp.fromDate(dueAtDate) : null
    const now = Timestamp.now()

    const ref = await db.collection('constructora_crm_tasks').add({
      constructoraCode: scopedCode,
      title,
      dueAt,
      status: safeLower(body.status || 'pending') || 'pending',
      priority: safeLower(body.priority || 'normal') || 'normal',
      assigneeUid: safeText(body.assigneeUid || context.uid),
      createdBy: context.uid,
      createdAt: now,
      updatedAt: now,
      linkedDealId: linkedDealId || null,
      source: safeText(body.source || 'manual') || 'manual',
    })

    return NextResponse.json({ ok: true, id: ref.id }, { status: 201 })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/tasks] POST error', error)
    return NextResponse.json({ ok: false, error: 'Failed to create constructora task' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'constructora') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const id = safeText(body.id || body.taskId)
    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

    const scopedCode = resolveScopedCode(context)
    const taskRef = db.collection('constructora_crm_tasks').doc(id)
    const taskSnap = await taskRef.get()
    if (!taskSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Task not found' }, { status: 404 })
    }

    const taskData = taskSnap.data() as Record<string, any>
    if (safeText(taskData.constructoraCode) !== scopedCode) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const update: Record<string, any> = {
      updatedAt: Timestamp.now(),
    }
    if (typeof body.status !== 'undefined') update.status = safeLower(body.status || 'pending') || 'pending'

    await taskRef.set(update, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/tasks] PATCH error', error)
    return NextResponse.json({ ok: false, error: 'Failed to update constructora task' }, { status: 500 })
  }
}