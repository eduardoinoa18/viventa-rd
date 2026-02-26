import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type AnyRecord = Record<string, any>

function toDateSafe(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') {
    const dt = value.toDate()
    return dt instanceof Date && !Number.isNaN(dt.getTime()) ? dt : null
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizeBrokerageKey(user: AnyRecord | null | undefined): string {
  if (!user) return ''
  return String(user.brokerage_id || user.brokerageId || user.brokerage || user.company || '')
    .trim()
    .toLowerCase()
}

function safeText(value: any): string {
  return typeof value === 'string' ? value : ''
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const role = String(session.role || '')
    const isAdmin = role === 'master_admin' || role === 'admin'
    const isBroker = role === 'broker'

    if (!isAdmin && !isBroker) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const userId = params.id
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'User id required' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const [targetSnap, actorSnap] = await Promise.all([
      adminDb.collection('users').doc(userId).get(),
      adminDb.collection('users').doc(session.uid).get(),
    ])

    if (!targetSnap.exists) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    const targetUser = { id: targetSnap.id, ...(targetSnap.data() || {}) } as AnyRecord
    const actorUser = actorSnap.exists ? ({ id: actorSnap.id, ...(actorSnap.data() || {}) } as AnyRecord) : null

    if (isBroker) {
      const actorBrokerage = normalizeBrokerageKey(actorUser)
      const targetBrokerage = normalizeBrokerageKey(targetUser)
      if (!actorBrokerage || !targetBrokerage || actorBrokerage !== targetBrokerage) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
      }
    }

    const [propertiesSnap, assignedLeadsSnap, invitesSnap] = await Promise.all([
      adminDb.collection('properties').where('agentId', '==', userId).get(),
      adminDb.collection('leads').where('assignedTo', '==', userId).get(),
      adminDb.collection('invitations').where('userId', '==', userId).get(),
    ])

    const properties = propertiesSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
    const assignedLeads = assignedLeadsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
    const invites = invitesSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))

    let buyerLeads: AnyRecord[] = []
    const targetEmail = safeText(targetUser.email).toLowerCase()
    if (targetEmail) {
      const buyerLeadsSnap = await adminDb.collection('leads').where('buyerEmail', '==', targetEmail).get()
      buyerLeads = buyerLeadsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
    }

    let recentActivity: AnyRecord[] = []
    try {
      const byEntity = await adminDb
        .collection('activity_logs')
        .where('entityId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(8)
        .get()
      recentActivity = byEntity.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
    } catch {
      const byUser = await adminDb
        .collection('activity_logs')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(8)
        .get()
      recentActivity = byUser.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
    }

    let teamStats: AnyRecord | null = null
    if (targetUser.role === 'broker') {
      const brokerageKey = normalizeBrokerageKey(targetUser)
      let teamAgents: AnyRecord[] = []

      if (brokerageKey) {
        const agentSnap = await adminDb.collection('users').where('role', '==', 'agent').get()
        teamAgents = agentSnap.docs
          .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
          .filter((agent) => normalizeBrokerageKey(agent) === brokerageKey)
      }

      teamStats = {
        teamAgents: teamAgents.length,
      }
    }

    const leadStats = {
      assigned: assignedLeads.length,
      won: assignedLeads.filter((lead: AnyRecord) => lead.status === 'won').length,
      lost: assignedLeads.filter((lead: AnyRecord) => lead.status === 'lost').length,
      contacted: assignedLeads.filter((lead: AnyRecord) => lead.status === 'contacted').length,
      unassigned: assignedLeads.filter((lead: AnyRecord) => lead.status === 'unassigned').length,
    }

    const listingStats = {
      total: properties.length,
      active: properties.filter((item: AnyRecord) => item.status === 'active').length,
      sold: properties.filter((item: AnyRecord) => item.status === 'sold').length,
      pending: properties.filter((item: AnyRecord) => item.status === 'pending').length,
    }

    const invitesSorted = invites
      .slice()
      .sort((a: AnyRecord, b: AnyRecord) => {
        const aTime = toDateSafe(a.createdAt)?.getTime() || 0
        const bTime = toDateSafe(b.createdAt)?.getTime() || 0
        return bTime - aTime
      })

    const latestInvite = invitesSorted[0]
    const conversionRate = leadStats.assigned > 0
      ? Number(((leadStats.won / leadStats.assigned) * 100).toFixed(2))
      : 0

    const response = {
      ok: true,
      data: {
        profile: {
          id: targetUser.id,
          name: safeText(targetUser.name),
          email: safeText(targetUser.email),
          phone: safeText(targetUser.phone),
          role: safeText(targetUser.role) || 'user',
          status: safeText(targetUser.status) || 'unknown',
          brokerage: safeText(targetUser.brokerage || targetUser.company),
          brokerageId: safeText(targetUser.brokerage_id || targetUser.brokerageId),
          createdAt: toDateSafe(targetUser.createdAt)?.toISOString() || null,
          lastLoginAt: toDateSafe(targetUser.lastLoginAt)?.toISOString() || null,
        },
        kpis: {
          leadStats,
          listingStats,
          buyerLeadsCount: buyerLeads.length,
          conversionRate,
          invite: latestInvite
            ? {
                status: safeText((latestInvite as AnyRecord).status) || (((latestInvite as AnyRecord).used) ? 'used' : 'pending'),
                used: !!(latestInvite as AnyRecord).used,
                expiresAt: toDateSafe((latestInvite as AnyRecord).expiresAt)?.toISOString() || null,
                createdAt: toDateSafe((latestInvite as AnyRecord).createdAt)?.toISOString() || null,
              }
            : null,
          teamStats,
        },
        recent: {
          leads: assignedLeads
            .slice()
            .sort((a: AnyRecord, b: AnyRecord) => {
              const aTime = toDateSafe(a.createdAt)?.getTime() || 0
              const bTime = toDateSafe(b.createdAt)?.getTime() || 0
              return bTime - aTime
            })
            .slice(0, 6)
            .map((lead: AnyRecord) => ({
              id: lead.id,
              status: safeText(lead.status) || 'unassigned',
              type: safeText(lead.type),
              source: safeText(lead.source),
              buyerName: safeText(lead.buyerName),
              buyerEmail: safeText(lead.buyerEmail),
              createdAt: toDateSafe(lead.createdAt)?.toISOString() || null,
            })),
          activity: recentActivity.map((item: AnyRecord) => ({
            id: item.id,
            type: safeText(item.type),
            action: safeText(item.action),
            timestamp: toDateSafe(item.timestamp)?.toISOString() || null,
            metadata: item.metadata || {},
          })),
        },
        access: {
          viewerRole: role,
          scopedByBrokerage: isBroker,
        },
      },
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[admin/users/:id/performance] error:', error?.message)
    return NextResponse.json(
      { ok: false, error: 'Failed to load user performance' },
      { status: 500 }
    )
  }
}