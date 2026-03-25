import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'

function parseRangeMs(range: string | null): number {
  switch (range) {
    case '7d':
      return 7 * 24 * 60 * 60 * 1000
    case '30d':
      return 30 * 24 * 60 * 60 * 1000
    case '24h':
    default:
      return 24 * 60 * 60 * 1000
  }
}

function toMillis(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value && typeof (value as any).toMillis === 'function') return (value as any).toMillis()
  if (value && typeof (value as any).seconds === 'number') return Number((value as any).seconds) * 1000
  const parsed = new Date(String(value || '')).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

export async function GET(req: NextRequest) {
  try {
    await requireMasterAdmin(req)

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range')
    const sinceMs = parseRangeMs(range)
    const since = Date.now() - sinceMs

    const [jobsSnap, emailEventsSnap] = await Promise.all([
      db.collection('recommendationJobs').orderBy('createdAt', 'desc').limit(500).get(),
      db.collection('email_events').orderBy('createdAt', 'desc').limit(500).get(),
    ])

    const jobs: Array<Record<string, any>> = jobsSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, any>),
    }))
    
    const filteredJobs = jobs.filter((job) => toMillis(job.createdAt || job.updatedAt) >= since)


    const totals = {
      queued: filteredJobs.filter((job) => job.status === 'queued').length,
      sent: filteredJobs.filter((job) => job.status === 'sent').length,
      failed: filteredJobs.filter((job) => job.status === 'failed').length,
      skipped: filteredJobs.filter((job) => job.status === 'skipped').length,
      processing: filteredJobs.filter((job) => job.status === 'processing').length,
      total: filteredJobs.length,
    }

    const recentFailures = filteredJobs
      .filter((job) => job.status === 'failed')
      .slice(0, 10)
      .map((job) => ({
        id: job.id,
        userId: job.userId || null,
        listingId: job.listingId || null,
        reason: job.error || job.reason || 'unknown',
        updatedAt: job.updatedAt || job.createdAt || null,
      }))


    const emailEvents: Array<Record<string, any>> = emailEventsSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, any>),
    }))

    const recommendationEmailEvents = emailEvents
      .filter((event) => {
        const template = String(event.template || '').toLowerCase()
        const category = String(event.category || '').toLowerCase()
        const subject = String(event.subject || '').toLowerCase()
        return template.includes('recommend') || category.includes('recommend') || subject.includes('recommend')
      })
      .filter((event) => toMillis(event.createdAt || event.receivedAt) >= since)
      .slice(0, 25)
      .map((event) => ({
        id: event.id,
        to: event.to || event.payload?.to || null,
        subject: event.subject || event.payload?.subject || null,
        eventType: event.eventType || 'unknown',
        provider: event.provider || 'unknown',
        timestamp: event.receivedAt || event.createdAt || null,
      }))

    return NextResponse.json({
      ok: true,
      data: {
        range: range || '24h',
        generatedAt: new Date().toISOString(),
        jobs: {
          totals,
          recentFailures,
        },
        email: {
          recommendationEventsCount: recommendationEmailEvents.length,
          recentEvents: recommendationEmailEvents,
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

    console.error('[admin/recommendations/overview] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load recommendation overview' }, { status: 500 })
  }
}
