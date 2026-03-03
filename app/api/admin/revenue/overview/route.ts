import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'

interface BillingSnapshot {
  customerId: string
  subscriptionStatus: string
  lastPaymentStatus: string
  priceIds: string[]
  updatedAt: string
}

export async function GET(req: NextRequest) {
  try {
    await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Admin SDK not configured' },
        { status: 503 }
      )
    }

    const billingSnap = await adminDb.collection('billing').limit(800).get()
    const billingRecords: BillingSnapshot[] = billingSnap.docs.map((doc) => {
      const data = doc.data() as any
      const items = Array.isArray(data?.subscription?.items) ? data.subscription.items : []
      return {
        customerId: doc.id,
        subscriptionStatus: String(data?.subscription?.status || 'unknown').toLowerCase(),
        lastPaymentStatus: String(data?.lastPaymentStatus || 'unknown').toLowerCase(),
        priceIds: items
          .map((item: any) => String(item?.price || '').trim())
          .filter(Boolean),
        updatedAt: data?.updatedAt?.toDate
          ? data.updatedAt.toDate().toISOString()
          : data?.updatedAt
            ? new Date(data.updatedAt).toISOString()
            : '',
      }
    })

    const statusBuckets = {
      active: 0,
      trialing: 0,
      past_due: 0,
      canceled: 0,
      incomplete: 0,
      unknown: 0,
    }

    const paymentBuckets = {
      succeeded: 0,
      failed: 0,
      unknown: 0,
    }

    const priceIdCounts = new Map<string, number>()

    for (const row of billingRecords) {
      const status = row.subscriptionStatus as keyof typeof statusBuckets
      if (status in statusBuckets) {
        statusBuckets[status] += 1
      } else {
        statusBuckets.unknown += 1
      }

      if (row.lastPaymentStatus === 'succeeded') {
        paymentBuckets.succeeded += 1
      } else if (row.lastPaymentStatus === 'failed') {
        paymentBuckets.failed += 1
      } else {
        paymentBuckets.unknown += 1
      }

      for (const priceId of row.priceIds) {
        priceIdCounts.set(priceId, (priceIdCounts.get(priceId) || 0) + 1)
      }
    }

    const priceBreakdown = Array.from(priceIdCounts.entries())
      .map(([priceId, subscribers]) => ({ priceId, subscribers }))
      .sort((a, b) => b.subscribers - a.subscribers)

    const stripeEventsSnap = await adminDb
      .collection('stripe_events')
      .orderBy('created', 'desc')
      .limit(10)
      .get()

    const recentStripeEvents = stripeEventsSnap.docs.map((doc) => {
      const data = doc.data() as any
      const created = Number(data?.created || 0)
      return {
        id: doc.id,
        type: String(data?.type || 'unknown'),
        createdAt: created > 0 ? new Date(created * 1000).toISOString() : '',
      }
    })

    const totalRecords = billingRecords.length
    const activeOrTrialing = statusBuckets.active + statusBuckets.trialing
    const healthScore = totalRecords === 0 ? 0 : Math.round((activeOrTrialing / totalRecords) * 100)

    return NextResponse.json({
      ok: true,
      data: {
        totals: {
          records: totalRecords,
          activeOrTrialing,
          pastDue: statusBuckets.past_due,
          canceled: statusBuckets.canceled,
          paymentFailures: paymentBuckets.failed,
          healthScore,
        },
        statusBuckets,
        paymentBuckets,
        priceBreakdown,
        recentStripeEvents,
      },
    })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[admin/revenue/overview] error', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to load revenue overview' },
      { status: 500 }
    )
  }
}
