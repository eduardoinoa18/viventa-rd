import { NextResponse } from 'next/server'
import type { Query } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext, resolveOfficeIdFromListing } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

function canReadOfficeListings(role: string) {
  return role === 'broker' || role === 'agent'
}

function toMillis(value: unknown): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object' && value !== null && 'toDate' in (value as any)) {
    const date = (value as any).toDate()
    return date instanceof Date ? date.getTime() : 0
  }
  return 0
}

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (!canReadOfficeListings(context.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ error: 'Broker office assignment required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = String(searchParams.get('status') || '').trim().toLowerCase()

    const queries: Query[] = [
      db.collection('properties').where('brokerId', '==', context.officeId),
      db.collection('properties').where('createdByBrokerId', '==', context.officeId),
      db.collection('properties').where('brokerageId', '==', context.officeId),
    ]

    const snapshots = await Promise.all(queries.map((query) => query.limit(200).get()))
    const deduped = new Map<string, Record<string, unknown>>()

    for (const snapshot of snapshots) {
      for (const doc of snapshot.docs) {
        const data = doc.data() as Record<string, unknown>
        if (status && String(data.status || '').toLowerCase() !== status) continue
        if (resolveOfficeIdFromListing(data) !== context.officeId) continue
        deduped.set(doc.id, { id: doc.id, ...data })
      }
    }

    const listings = Array.from(deduped.values()).sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    return NextResponse.json({ listings, officeId: context.officeId })
  } catch (error: any) {
    console.error('broker office listings GET error', error)
    return NextResponse.json({ error: error?.message || 'Failed to fetch office listings' }, { status: 500 })
  }
}
