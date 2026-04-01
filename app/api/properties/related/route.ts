import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city')
    const exclude = searchParams.get('exclude')
    const propertyType = searchParams.get('propertyType')
    const priceRange = searchParams.get('priceRange')
    const limitParam = parseInt(searchParams.get('limit') || '4', 10)

    if (!city) {
      return NextResponse.json({ error: 'City parameter required' }, { status: 400 })
    }

    // Build query
    let ref = db.collection('properties').where('city', '==', city).where('status', '==', 'active')

    // Add property type filter if provided
    if (propertyType) {
      ref = ref.where('propertyType', '==', propertyType)
    }

    const snapshot = await ref.limit(limitParam * 2).get()

    let properties: any[] = snapshot.docs
      .filter((doc) => doc.id !== exclude) // Exclude current property
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

    // Filter by price range if provided
    if (priceRange) {
      const [minStr, maxStr] = priceRange.split('-')
      const min = parseInt(minStr, 10)
      const max = parseInt(maxStr, 10)
      properties = properties.filter((p) => (p.price || 0) >= min && (p.price || 0) <= max)
    }

    // Limit results
    const results = properties.slice(0, limitParam).map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      currency: p.currency,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      area: p.area,
      city: p.city,
      sector: p.sector,
      image: p.mainImage || p.images?.[0] || '/placeholder-property.jpg',
      listingType: p.listingType,
    }))

    return NextResponse.json({ data: results, count: results.length })
  } catch (error) {
    console.error('Error fetching related properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch related properties' },
      { status: 500 }
    )
  }
}
