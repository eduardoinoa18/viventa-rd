import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'master_admin' && context.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 50), 1), 200)

    const snap = await db
      .collection('deal_automation_runs')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    const runs = snap.docs.map((doc) => {
      const d = doc.data() as Record<string, any>
      return {
        id: doc.id,
        createdAt: d.createdAt?.toDate?.()?.toISOString?.() || null,
        actorId: String(d.actorId || 'system'),
        checked: {
          broker: Number(d.checked?.broker || 0),
          constructora: Number(d.checked?.constructora || 0),
        },
        alerts: {
          broker: Number(d.alerts?.broker || 0),
          brokerOverdue: Number(d.alerts?.brokerOverdue || 0),
          brokerAttention: Number(d.alerts?.brokerAttention || 0),
          brokerTasksCreated: Number(d.alerts?.brokerTasksCreated || 0),
          constructora: Number(d.alerts?.constructora || 0),
          constructoraOverdue: Number(d.alerts?.constructoraOverdue || 0),
          constructoraAttention: Number(d.alerts?.constructoraAttention || 0),
          constructoraTasksCreated: Number(d.alerts?.constructoraTasksCreated || 0),
        },
        limits: {
          broker: Number(d.limits?.broker || 0),
          constructora: Number(d.limits?.constructora || 0),
          brokerTasks: Number(d.limits?.brokerTasks || 0),
          constructoraTasks: Number(d.limits?.constructoraTasks || 0),
        },
      }
    })

    return NextResponse.json({ ok: true, runs })
  } catch (error: any) {
    console.error('[api/admin/deals/automation/history] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load automation runs' }, { status: 500 })
  }
}
