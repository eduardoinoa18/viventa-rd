import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import type { AnalyticsDailySummary, AnalyticsEvent } from '@/types/analytics'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'

export const dynamic = 'force-dynamic'

function toDateStringUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .split('T')[0]
}

function getYesterdayUTC(): string {
  const now = new Date()
  const y = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  y.setUTCDate(y.getUTCDate() - 1)
  return y.toISOString().split('T')[0]
}

function assertCronSecret(req: NextRequest) {
  // Allow Vercel Scheduled Cron which sets this header automatically
  if (req.headers.get('x-vercel-cron')) return true
  const required = process.env.CRON_SECRET
  if (!required) return true // allow if not configured to avoid lockouts in dev
  const provided = req.headers.get('x-cron-secret') || req.headers.get('x-vercel-signature')
  return provided === required
}

export async function GET(req: NextRequest) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN','ADMIN','SUPPORT'] })
  if (authResult instanceof Response) return authResult

  try {
    if (!assertCronSecret(req)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Firebase Admin not initialized. Check service account env vars.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date') // YYYY-MM-DD
    const targetDate = dateParam || getYesterdayUTC()

    // Query all events for target date
    const snap = await db.collection('analytics_events').where('date', '==', targetDate).get()
    const events: AnalyticsEvent[] = []
    snap.forEach((doc) => {
      const data = doc.data() as any
      // Firestore stores timestamps as Timestamp; convert to Date when present
      const ts = (data.timestamp && 'toDate' in data.timestamp) ? data.timestamp.toDate() : new Date(data.timestamp || Date.now())
      events.push({ ...data, timestamp: ts })
    })

    // Aggregations
    const uniqueUsers = new Set<string>()

    let newUsers = 0
    let signupsAgent = 0
    let signupsBroker = 0
    let signupsUser = 0

    let listingsCreated = 0
    let listingsViewed = 0
    let listingsEdited = 0

    let leadsCreated = 0
    let leadsOpened = 0
    let messagesSent = 0
    let searchesPerformed = 0
    let favoritesAdded = 0

    let emailsSent = 0
    let filesUploaded = 0
    let errorCount = 0
    let conversions = 0

    for (const ev of events) {
      const uid = ev.userId
      if (uid && uid !== 'anonymous') uniqueUsers.add(uid)

      switch (ev.eventType) {
        case 'signup':
          newUsers += 1
          if (ev.userRole === 'agent') signupsAgent += 1
          else if (ev.userRole === 'broker') signupsBroker += 1
          else signupsUser += 1
          break
        case 'listing_create':
          listingsCreated += 1
          break
        case 'listing_view':
          listingsViewed += 1
          break
        case 'listing_edit':
          listingsEdited += 1
          break
        case 'lead_create':
          leadsCreated += 1
          break
        case 'lead_opened':
          leadsOpened += 1
          break
        case 'message_sent':
          messagesSent += 1
          break
        case 'search_performed':
          searchesPerformed += 1
          break
        case 'favorite_added':
          favoritesAdded += 1
          break
        case 'email_sent':
          emailsSent += 1
          break
        case 'file_upload':
          filesUploaded += 1
          break
        case 'error':
          errorCount += 1
          break
        case 'conversion':
          conversions += 1
          break
        default:
          break
      }
    }

    const summary: AnalyticsDailySummary = {
      date: targetDate,
      dau: uniqueUsers.size,
      newUsers,
      signupsAgent,
      signupsBroker,
      signupsUser,
      listingsCreated,
      listingsViewed,
      listingsEdited,
      leadsCreated,
      leadsOpened,
      messagesSent,
      searchesPerformed,
      favoritesAdded,
      emailsSent,
      filesUploaded,
      errorCount,
      conversions,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Write to analytics_daily collection with doc id = date (idempotent)
    await db.collection('analytics_daily').doc(targetDate).set(summary, { merge: true })

    return NextResponse.json({ ok: true, data: summary })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}
