import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ActivityLogger } from '@/lib/activityLogger'

export const runtime = 'nodejs'

/**
 * POST /api/admin/leads/auto-assign
 * Body: { leadId: string }
 * Strategy:
 *  - Load lead; ensure not already assigned
 *  - Load active agents and brokers
 *  - Prefer premium users (user.plan === 'premium')
 *  - Round-robin among chosen set using counters/lead_assignment doc
 */
export async function POST(req: NextRequest) {
  try {
    const { leadId } = await req.json()
    if (!leadId) return NextResponse.json({ ok: false, error: 'leadId required' }, { status: 400 })

    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ ok: false, error: 'Admin not configured' }, { status: 500 })

    const leadRef = adminDb.collection('property_inquiries').doc(leadId)
    const leadSnap = await leadRef.get()
    if (!leadSnap.exists) return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 })
    const lead = leadSnap.data() as any
    if (lead.status === 'assigned' && lead.assignedTo) {
      return NextResponse.json({ ok: false, error: 'Lead already assigned' }, { status: 400 })
    }

    // Load candidates: active agents or brokers
    const usersSnap = await adminDb
      .collection('users')
      .where('status', '==', 'active')
      .where('role', 'in', ['agent', 'broker'])
      .get()
    const all = usersSnap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }))

    if (all.length === 0) return NextResponse.json({ ok: false, error: 'No candidates available' }, { status: 404 })

    const isPremium = (u: any) => String(u.plan || '').toLowerCase() === 'premium'

    const premium = all.filter(isPremium)
    const standard = all.filter(u => !isPremium(u))
    const pool = premium.length > 0 ? premium : standard

    // Round-robin using counters/lead_assignment doc
    const countersRef = adminDb.collection('counters').doc('lead_assignment')
    const countersSnap = await countersRef.get()
    const data = (countersSnap.exists ? countersSnap.data() : {}) as any
    const lastUid: string | undefined = data.lastAssignedUid

    // stable sort by name to ensure deterministic iteration
    pool.sort((a: any, b: any) => String(a.name || a.company || '').localeCompare(String(b.name || b.company || '')))

    let index = 0
    if (lastUid) {
      const found = pool.findIndex(p => p.id === lastUid)
      index = found >= 0 ? (found + 1) % pool.length : 0
    }

    const assignee = pool[index]

    // persist assignment
    await leadRef.set({
      status: 'assigned',
      assignedTo: {
        uid: assignee.id,
        name: assignee.name || assignee.company || 'Sin nombre',
        role: assignee.role,
        email: assignee.email || '',
      },
      assignedAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true })

    // update counter
    await countersRef.set({ lastAssignedUid: assignee.id, updatedAt: new Date() }, { merge: true })

    // activity log
    try {
      await ActivityLogger.log({
        type: 'lead',
        action: 'Lead Auto-Assigned',
        metadata: {
          leadId,
          propertyId: lead?.propertyId,
          propertyTitle: lead?.propertyTitle,
          assigneeId: assignee.id,
          assigneeName: assignee.name || assignee.company,
          premium: isPremium(assignee),
        }
      })
    } catch {}

    return NextResponse.json({ ok: true, assignee: { uid: assignee.id, name: assignee.name || assignee.company, role: assignee.role, email: assignee.email } })
  } catch (e: any) {
    console.error('auto-assign lead error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Internal error' }, { status: 500 })
  }
}
