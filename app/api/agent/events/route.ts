import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

function getAuthInfo(req: NextRequest) {
  const role = req.cookies.get('viventa_role')?.value
  const uid = req.cookies.get('viventa_uid')?.value
  return { role, uid }
}

function canAccess(role?: string) {
  return role === 'agent' || role === 'broker' || role === 'admin' || role === 'master_admin'
}

const COLLECTION = 'agent_events'
// Event shape (for reference): {
//   id: string
//   agentId: string
//   title: string
//   date: string (YYYY-MM-DD)
//   time?: string
//   type: 'showing' | 'meeting' | 'closing' | 'other'
//   location?: string
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
    if (agentParam !== uid && !(role === 'broker' || role === 'admin' || role === 'master_admin')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    // Optional date range filtering
    const from = req.nextUrl.searchParams.get('from')
    const to = req.nextUrl.searchParams.get('to')

    let ref = db.collection(COLLECTION).where('agentId', '==', agentParam)
    if (from && to) {
      ref = ref.where('date', '>=', from).where('date', '<=', to)
    }

    const snap = await ref.orderBy('date', 'asc').get()
    const events = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ ok: true, events })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Failed to fetch events' }, { status: 500 })
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
    const { title, date, time, type, location } = body
    if (!title || !date || !type) return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    if (!['showing', 'meeting', 'closing', 'other'].includes(type)) return NextResponse.json({ ok: false, error: 'Invalid type' }, { status: 400 })

    const now = new Date().toISOString()
    const docRef = await db.collection(COLLECTION).add({
      agentId: uid,
      title: String(title).trim(),
      date,
      time: time || '',
      type,
      location: location || '',
      createdAt: now,
      updatedAt: now,
    })
    return NextResponse.json({ ok: true, id: docRef.id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Failed to create event' }, { status: 500 })
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
    const { id, title, date, time, type, location } = body
    if (!id) return NextResponse.json({ ok: false, error: 'Event id required' }, { status: 400 })

    const docRef = db.collection(COLLECTION).doc(id)
    const existing = await docRef.get()
    if (!existing.exists) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    const data = existing.data() || {}
    if (data.agentId !== uid && !(role === 'broker' || role === 'admin' || role === 'master_admin')) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const updates: any = { updatedAt: new Date().toISOString() }
    if (typeof title !== 'undefined') updates.title = String(title).trim()
    if (typeof date !== 'undefined') updates.date = date
    if (typeof time !== 'undefined') updates.time = time
    if (typeof type !== 'undefined') {
      if (!['showing', 'meeting', 'closing', 'other'].includes(type)) {
        return NextResponse.json({ ok: false, error: 'Invalid type' }, { status: 400 })
      }
      updates.type = type
    }
    if (typeof location !== 'undefined') updates.location = location

    await docRef.update(updates)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Failed to update event' }, { status: 500 })
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
    if (!id) return NextResponse.json({ ok: false, error: 'Event id required' }, { status: 400 })

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
    return NextResponse.json({ ok: false, error: e.message || 'Failed to delete event' }, { status: 500 })
  }
}
