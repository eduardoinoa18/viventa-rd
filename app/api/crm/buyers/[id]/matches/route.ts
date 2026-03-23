// app/api/crm/buyers/[id]/matches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { getBuyerMatches, normalizeBuyerCriteria } from '@/lib/crmBuyerMatching'

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

    const criteria = normalizeBuyerCriteria((buyer.criteria || {}) as Record<string, any>)
    const result = await getBuyerMatches(adminDb, criteria, 20)
    const listings = result.listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      beds: listing.bedrooms,
      baths: listing.bathrooms,
      mt2: listing.squareMeters,
      city: listing.city,
      sector: listing.sector,
      image: listing.image,
      verified: listing.verified,
      pricePerM2: listing.pricePerM2,
    }))

    return NextResponse.json({
      ok: true,
      data: {
        buyerId,
        criteria,
        listingsCount: listings.length,
        listings,
        ...(result.warning ? { warning: result.warning } : {}),
      },
    })
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
