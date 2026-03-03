import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'

function toDate(value: any): Date | null {
  if (!value) return null
  if (typeof value?.toDate === 'function') {
    const d = value.toDate()
    return Number.isFinite(d.getTime()) ? d : null
  }
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? d : null
}

function hoursSince(date: Date | null): number {
  if (!date) return Number.POSITIVE_INFINITY
  const diff = Date.now() - date.getTime()
  return diff / (1000 * 60 * 60)
}

export async function GET(req: NextRequest) {
  try {
    await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const [usersSnap, appsSnap, lifecycleEventsSnap] = await Promise.all([
      adminDb.collection('users').limit(10000).get(),
      adminDb.collection('applications').where('status', '==', 'pending').limit(2000).get(),
      adminDb.collection('user_lifecycle_events').orderBy('createdAt', 'desc').limit(500).get().catch(() => ({ docs: [] })),
    ])

    const roleCounts: Record<string, number> = {
      buyer: 0,
      agent: 0,
      broker: 0,
      constructora: 0,
      admin: 0,
      master_admin: 0,
      other: 0,
    }

    let invitedPending = 0
    let stalledInvites = 0
    let suspendedUsers = 0
    let unverifiedActive = 0
    let onboardingComplete = 0

    for (const doc of usersSnap.docs) {
      const user = doc.data() as any
      const role = String(user?.role || 'other').toLowerCase()
      if (role in roleCounts) roleCounts[role] += 1
      else roleCounts.other += 1

      const status = String(user?.status || '').toLowerCase()
      if (status === 'invited') {
        invitedPending += 1
        const invitedAt = toDate(user?.createdAt)
        if (hoursSince(invitedAt) > 72) stalledInvites += 1
      }

      const isSuspended = !!user?.disabled || status === 'suspended' || status === 'inactive' || status === 'archived'
      if (isSuspended) suspendedUsers += 1

      const isActive = status === 'active' && !user?.disabled
      if (isActive && !user?.emailVerified) unverifiedActive += 1

      const hasPhone = !!String(user?.phone || '').trim()
      const hasProfileSignal = !!String(user?.bio || '').trim() || !!String(user?.companyInfo || '').trim() || !!String(user?.brokerageName || '').trim()
      if (hasPhone && hasProfileSignal && isActive) onboardingComplete += 1
    }

    const totalUsers = usersSnap.size
    const onboardingCompletionRate = totalUsers === 0 ? 0 : Math.round((onboardingComplete / totalUsers) * 100)

    const pendingApplicationsByType: Record<string, number> = {
      agent: 0,
      'new-agent': 0,
      broker: 0,
      constructora: 0,
      other: 0,
    }

    for (const doc of appsSnap.docs) {
      const app = doc.data() as any
      const type = String(app?.type || '').toLowerCase()
      if (type === 'agent' || type === 'new-agent' || type === 'broker' || type === 'constructora') {
        pendingApplicationsByType[type] += 1
      } else {
        pendingApplicationsByType.other += 1
      }
    }

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const lifecycleEvents7d = (lifecycleEventsSnap as any).docs.filter((doc: any) => {
      const data = doc.data() || {}
      const created = toDate(data?.createdAt)
      return created ? created.getTime() >= sevenDaysAgo : false
    }).length

    return NextResponse.json({
      ok: true,
      data: {
        totals: {
          totalUsers,
          invitedPending,
          stalledInvites,
          suspendedUsers,
          unverifiedActive,
          onboardingCompletionRate,
        },
        roleCounts,
        pendingApplications: {
          total: appsSnap.size,
          byType: pendingApplicationsByType,
        },
        governance: {
          lifecycleEvents7d,
        },
      },
    })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[admin/users/overview] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load users overview' }, { status: 500 })
  }
}
