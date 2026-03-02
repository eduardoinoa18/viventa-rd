/**
 * Single Developer API
 * Get developer details with stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const { id } = params

    // Get developer data
    const developerDoc = await db.collection('developers').doc(id).get()

    if (!developerDoc.exists) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
    }

    const developer = {
      id: developerDoc.id,
      ...developerDoc.data()
    }

    // Get associated listings for stats
    const listingsSnapshot = await db
      .collection('properties')
      .where('developerId', '==', id)
      .get()

    const listings = listingsSnapshot.docs.map(doc => doc.data())

    const stats = {
      totalListings: listings.length,
      activeListings: listings.filter(l => l.status === 'active').length,
      soldListings: listings.filter(l => l.status === 'sold').length,
      totalValue: listings.reduce((sum, l) => sum + (l.price || 0), 0),
      averagePrice: listings.length > 0
        ? listings.reduce((sum, l) => sum + (l.price || 0), 0) / listings.length
        : 0
    }

    return NextResponse.json({
      ok: true,
      developer: {
        ...developer,
        stats
      }
    })
  } catch (error: any) {
    console.error('Error fetching developer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch developer' },
      { status: 500 }
    )
  }
}
