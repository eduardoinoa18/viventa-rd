import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })

    let snap
    try {
      snap = await adminDb.collection('billing_plans').orderBy('createdAt', 'desc').limit(200).get()
    } catch {
      snap = await adminDb.collection('billing_plans').limit(200).get()
    }

    const data = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[admin/revenue/plans][GET] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load billing plans' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })

    const { name, roleScope, interval, amount, currency, description, stripePriceId, active } = await req.json()

    if (!name || !interval || typeof amount !== 'number') {
      return NextResponse.json({ ok: false, error: 'name, interval and amount are required' }, { status: 400 })
    }

    const now = new Date()
    const payload = {
      name: String(name).trim(),
      roleScope: Array.isArray(roleScope) ? roleScope : ['agent', 'broker', 'constructora'],
      interval: String(interval).trim(),
      amount,
      currency: String(currency || 'USD').toUpperCase(),
      description: String(description || '').trim(),
      stripePriceId: String(stripePriceId || '').trim(),
      active: typeof active === 'boolean' ? active : true,
      createdBy: admin.email,
      createdAt: now,
      updatedAt: now,
    }

    const created = await adminDb.collection('billing_plans').add(payload)
    return NextResponse.json({ ok: true, data: { id: created.id, ...payload } })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[admin/revenue/plans][POST] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to create billing plan' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
    }

    await adminDb.collection('billing_plans').doc(String(id)).delete()
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[admin/revenue/plans][DELETE] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to delete billing plan' }, { status: 500 })
  }
}
