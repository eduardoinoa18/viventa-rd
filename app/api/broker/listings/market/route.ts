import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext, resolveOfficeIdFromListing } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

type ListingRecord = Record<string, unknown> & {
  id: string
  listingType?: string
  city?: string
  createdAt?: unknown
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
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const status = String(searchParams.get('status') || 'active').trim().toLowerCase()
    const listingType = String(searchParams.get('listingType') || '').trim().toLowerCase()
    const city = String(searchParams.get('city') || '').trim().toLowerCase()

    const session = await getSessionFromRequest(req)
    let requesterOfficeId = ''
    if (session?.uid) {
      const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
      requesterOfficeId = context.officeId
    }

    const snapshot = await db.collection('properties').where('status', '==', status).limit(300).get()
    const listings = snapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as ListingRecord)
      .filter((listing) => {
        if (listingType && String(listing.listingType || '').toLowerCase() !== listingType) return false
        if (city && String(listing.city || '').toLowerCase() !== city) return false
        if (requesterOfficeId && resolveOfficeIdFromListing(listing) === requesterOfficeId) return false
        return true
      })
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))

    return NextResponse.json({ listings })
  } catch (error: any) {
    console.error('broker market listings GET error', error)
    return NextResponse.json({ error: error?.message || 'Failed to fetch market listings' }, { status: 500 })
  }
}
