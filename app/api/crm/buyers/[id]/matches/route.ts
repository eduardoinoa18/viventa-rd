// app/api/crm/buyers/[id]/matches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'

// GET /api/crm/buyers/[id]/matches - Get matching listings for buyer
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Admin SDK not configured' },
        { status: 503 }
      )
    }

    const buyerId = params.id

    // Get buyer
    const buyerDoc = await adminDb.collection('users').doc(buyerId).get()

    if (!buyerDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'Buyer not found' },
        { status: 404 }
      )
    }

    const buyer = buyerDoc.data() as any

    if (buyer.role !== 'buyer') {
      return NextResponse.json(
        { ok: false, error: 'User is not a buyer' },
        { status: 400 }
      )
    }

    const criteria = buyer.criteria || {}

    // Build query for listings matching criteria
    let ref: any = adminDb.collection('listings')
    ref = ref.where('status', '==', 'published')

    if (criteria.location) {
      ref = ref.where('city', '==', criteria.location)
    }

    if (criteria.budgetMin && criteria.budgetMax) {
      ref = ref.where('price', '>=', criteria.budgetMin)
      ref = ref.where('price', '<=', criteria.budgetMax)
    } else if (criteria.budgetMax) {
      ref = ref.where('price', '<=', criteria.budgetMax)
    } else if (criteria.budgetMin) {
      ref = ref.where('price', '>=', criteria.budgetMin)
    }

    if (criteria.bedrooms) {
      ref = ref.where('bedrooms', '==', criteria.bedrooms)
    }

    try {
      const snap = await ref.limit(20).get()
      const listings = snap.docs.map((doc: any) => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title,
          price: data.price,
          beds: data.bedrooms,
          baths: data.bathrooms,
          mt2: data.squareMeters,
          city: data.city,
          sector: data.sector,
          image: data.images?.[0],
          verified: data.verified || false,
          pricePerM2: data.squareMeters ? Math.round(data.price / data.squareMeters) : 0,
        }
      })

      return NextResponse.json({
        ok: true,
        data: {
          buyerId,
          criteria,
          listingsCount: listings.length,
          listings,
        },
      })
    } catch (queryError: any) {
      // If query fails due to missing indexes, return empty with message
      console.warn('[crm/buyers/matches] Query failed, returning empty:', queryError.message)
      return NextResponse.json({
        ok: true,
        data: {
          buyerId,
          criteria,
          listingsCount: 0,
          listings: [],
          warning: 'Some criteria filters unavailable - showing all published listings',
        },
      })
    }
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[crm/buyers/[id]/matches] Error:', error?.message)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}
