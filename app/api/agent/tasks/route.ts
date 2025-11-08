import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

// Validate auth from cookies (lightweight server-side check)
function getAuthInfo(req: NextRequest) {
  const role = req.cookies.get('viventa_role')?.value
  const uid = req.cookies.get('viventa_uid')?.value
  return { role, uid }
}

// Allowed roles for agent task operations: agent (own), broker/admin (can view all if extended later)
function canAccess(role?: string) {
  return role === 'agent' || role === 'broker' || role === 'admin' || role === 'master_admin'
}

// Collection name
const COLLECTION = 'agent_tasks'

// Shape reference (not enforced runtime, for clarity)
// {
//   id: string (doc id)
//   agentId: string
//   title: string
//   dueDate: string (YYYY-MM-DD)
//   priority: 'high' | 'medium' | 'low'
//   completed: boolean
//   createdAt: string
//   updatedAt: string
// }

export async function GET(req: NextRequest) {
  try {
    const { role, uid } = getAuthInfo(req)
    if (!canAccess(role) || !uid) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 500 })

    const agentParam = req.nextUrl.searchParams.get('agentId') || uid
    // Only allow querying other agents if broker/admin
    if (agentParam !== uid && !(role === 'broker' || role === 'admin' || role === 'master_admin')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const snap = await db.collection(COLLECTION).where('agentId', '==', agentParam).orderBy('dueDate', 'asc').get()
    const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ ok: true, tasks })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { role, uid } = getAuthInfo(req)
    if (!canAccess(role) || !uid) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 500 })

    const body = await req.json()
    const { title, dueDate, priority } = body
    if (!title || !dueDate || !priority) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const docRef = await db.collection(COLLECTION).add({
      agentId: uid,
      title: String(title).trim(),
      dueDate,
      priority: ['high', 'medium', 'low'].includes(priority) ? priority : 'medium',
      completed: false,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ ok: true, id: docRef.id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Failed to create task' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { role, uid } = getAuthInfo(req)
    if (!canAccess(role) || !uid) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 500 })

    const body = await req.json()
    const { id, title, dueDate, priority, completed } = body
    if (!id) return NextResponse.json({ ok: false, error: 'Task id required' }, { status: 400 })

    const docRef = db.collection(COLLECTION).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    const data = existing.data() || {}
    if (data.agentId !== uid && !(role === 'broker' || role === 'admin' || role === 'master_admin')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const updates: any = { updatedAt: new Date().toISOString() }
    if (typeof title !== 'undefined') updates.title = String(title).trim()
    if (typeof dueDate !== 'undefined') updates.dueDate = dueDate
    if (typeof priority !== 'undefined') updates.priority = ['high', 'medium', 'low'].includes(priority) ? priority : data.priority
    if (typeof completed !== 'undefined') updates.completed = !!completed

    await docRef.update(updates)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { role, uid } = getAuthInfo(req)
    if (!canAccess(role) || !uid) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 500 })

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, error: 'Task id required' }, { status: 400 })

    const docRef = db.collection(COLLECTION).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    const data = existing.data() || {}
    if (data.agentId !== uid && !(role === 'broker' || role === 'admin' || role === 'master_admin')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    await docRef.delete()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Failed to delete task' }, { status: 500 })
  }
}
