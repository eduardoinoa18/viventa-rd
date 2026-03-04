import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'

type DayPoint = { date: string; value: number }

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getRecentDays(days: number): string[] {
  const list: string[] = []
  const now = new Date()
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    d.setUTCDate(d.getUTCDate() - offset)
    list.push(toDateKey(d))
  }
  return list
}

function toIsoDate(value: any): string {
  if (!value) return ''
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return Number.isFinite(date.getTime()) ? date.toISOString() : ''
  }
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : ''
}

function getDateKeyFromSource(value: any): string {
  const iso = toIsoDate(value)
  return iso ? iso.slice(0, 10) : ''
}

export async function GET(req: NextRequest) {
  try {
    await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const days = 30
    const dayKeys = getRecentDays(days)
    const keySet = new Set(dayKeys)

    const usersSnap = await adminDb.collection('users').limit(6000).get()
    const leadsSnap = await adminDb.collection('leads').limit(8000).get()
    const analyticsDailySnap = await adminDb.collection('analytics_daily').orderBy('date', 'desc').limit(90).get()

    const signupMap = new Map<string, number>()
    const leadMap = new Map<string, number>()

    for (const key of dayKeys) {
      signupMap.set(key, 0)
      leadMap.set(key, 0)
    }

    let totalUsers = 0
    let registrationCompleted = 0

    usersSnap.docs.forEach((doc) => {
      const data = doc.data() as any
      totalUsers += 1
      if (String(data?.status || '').toLowerCase() === 'active') {
        registrationCompleted += 1
      }

      const key = getDateKeyFromSource(data?.createdAt)
      if (key && keySet.has(key)) {
        signupMap.set(key, (signupMap.get(key) || 0) + 1)
      }
    })

    const leadStatusCounts = {
      created: 0,
      contacted: 0,
      won: 0,
      lost: 0,
    }

    leadsSnap.docs.forEach((doc) => {
      const data = doc.data() as any
      leadStatusCounts.created += 1

      const stage = String(data?.leadStage || data?.status || '').toLowerCase()
      if (stage === 'contacted' || stage === 'qualified' || stage === 'negotiating' || stage === 'won') {
        leadStatusCounts.contacted += 1
      }
      if (stage === 'won') leadStatusCounts.won += 1
      if (stage === 'lost' || stage === 'archived') leadStatusCounts.lost += 1

      const key = getDateKeyFromSource(data?.createdAt)
      if (key && keySet.has(key)) {
        leadMap.set(key, (leadMap.get(key) || 0) + 1)
      }
    })

    const dailyAnalytics = analyticsDailySnap.docs.map((doc) => doc.data() as any)

    const views30d = dailyAnalytics
      .filter((row) => keySet.has(String(row?.date || '')))
      .reduce((acc, row) => acc + Number(row?.listingsViewed || 0), 0)

    const inquiries30d = dailyAnalytics
      .filter((row) => keySet.has(String(row?.date || '')))
      .reduce((acc, row) => acc + Number(row?.leadsCreated || 0), 0)

    const emailSent30d = dailyAnalytics
      .filter((row) => keySet.has(String(row?.date || '')))
      .reduce((acc, row) => acc + Number(row?.emailsSent || 0), 0)

    const messageSent30d = dailyAnalytics
      .filter((row) => keySet.has(String(row?.date || '')))
      .reduce((acc, row) => acc + Number(row?.messagesSent || 0), 0)

    const signupsDaily: DayPoint[] = dayKeys.map((date) => ({ date, value: signupMap.get(date) || 0 }))
    const leadsDaily: DayPoint[] = dayKeys.map((date) => ({ date, value: leadMap.get(date) || 0 }))

    const registrationCompletionRate = totalUsers === 0 ? 0 : Math.round((registrationCompleted / totalUsers) * 100)
    const inquiryConversionRate = views30d === 0 ? 0 : Math.round((inquiries30d / views30d) * 1000) / 10
    const leadToCloseRate = leadStatusCounts.created === 0 ? 0 : Math.round((leadStatusCounts.won / leadStatusCounts.created) * 1000) / 10

    return NextResponse.json({
      ok: true,
      data: {
        totals: {
          signups30d: signupsDaily.reduce((acc, item) => acc + item.value, 0),
          leads30d: leadsDaily.reduce((acc, item) => acc + item.value, 0),
          views30d,
          inquiries30d,
          emailSent30d,
          messageSent30d,
          registrationCompletionRate,
          inquiryConversionRate,
          leadToCloseRate,
        },
        funnel: {
          users: totalUsers,
          registrationCompleted,
          leadsCreated: leadStatusCounts.created,
          leadsContacted: leadStatusCounts.contacted,
          leadsWon: leadStatusCounts.won,
          leadsLost: leadStatusCounts.lost,
        },
        trends: {
          signupsDaily,
          leadsDaily,
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

    console.error('[admin/growth/overview] error', error)
    return NextResponse.json({ ok: false, error: 'No se pudo cargar el resumen de crecimiento' }, { status: 500 })
  }
}
