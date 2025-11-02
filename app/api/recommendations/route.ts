// app/api/recommendations/route.ts
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'default-no-store'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore'

type Property = {
  id: string
  title: string
  location: string
  city?: string
  price: number
  bedrooms: number
  bathrooms: number
  area: number
  propertyType: 'apartment' | 'house' | 'condo' | 'land' | 'commercial'
  listingType: 'sale' | 'rent'
  images: string[]
  agentName?: string
  featured?: boolean
  score?: number
}

function getCookie(req: NextRequest, name: string): string | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

async function getUserPreferences(userId: string) {
  // In future, fetch from Firestore user_preferences collection
  // For now, return defaults
  return {
    priceMin: 50000,
    priceMax: 300000,
    bedrooms: 2,
    propertyType: null,
    preferredCities: ['Santo Domingo', 'Santiago', 'Punta Cana']
  }
}

async function getUserBehavior(userId: string) {
  // In future, fetch from Firestore user_activity collection
  // For now, return mock behavior
  return {
    viewedProperties: [],
    searchedLocations: ['Santo Domingo'],
    favoritePropertyTypes: ['apartment', 'house'],
    avgPriceViewed: 150000,
  }
}

function scoreProperty(p: Property, prefs: any, behavior: any): number {
  let score = 50

  // Price match
  const pMin = prefs.priceMin || 0
  const pMax = prefs.priceMax || Number.MAX_SAFE_INTEGER
  if (p.price >= pMin && p.price <= pMax) {
    const mid = (pMin + pMax) / 2
    const dist = Math.abs(p.price - mid)
    const span = Math.max(1, pMax - pMin)
    score += Math.round((1 - Math.min(1, dist / span)) * 20)
  } else {
    score -= 15
  }

  // City match
  const city = (p.city || p.location || '').toLowerCase()
  if (prefs.preferredCities && prefs.preferredCities.some((c: string) => city.includes(c.toLowerCase()))) {
    score += 15
  }

  // Bedroom match
  if (prefs.bedrooms && p.bedrooms >= prefs.bedrooms) {
    score += 10
  }

  // Property type match
  if (prefs.propertyType && p.propertyType === prefs.propertyType) {
    score += 10
  }

  // Behavior: property type preference
  if (behavior.favoritePropertyTypes && behavior.favoritePropertyTypes.includes(p.propertyType)) {
    score += 8
  }

  // Behavior: price similarity to viewed properties
  if (behavior.avgPriceViewed) {
    const priceDiff = Math.abs(p.price - behavior.avgPriceViewed)
    const similarity = 1 - Math.min(1, priceDiff / behavior.avgPriceViewed)
    score += Math.round(similarity * 10)
  }

  // Featured boost
  if (p.featured) score += 5

  return Math.max(0, Math.min(100, score))
}

export async function GET(req: NextRequest) {
  try {
    const uid = getCookie(req, 'viventa_uid')
    if (!uid) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }

    const prefs = await getUserPreferences(uid)
    const behavior = await getUserBehavior(uid)

    // Fetch active properties
    let properties: Property[] = []
    try {
      const q = query(
        collection(db, 'properties'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
      const snap = await getDocs(q)
      properties = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Property[]
    } catch (e) {
      // Firebase not configured, use mock data
      properties = [
        {
          id: 'rec1',
          title: 'Apartamento moderno en Naco',
          location: 'Santo Domingo',
          city: 'Santo Domingo',
          price: 145000,
          bedrooms: 3,
          bathrooms: 2,
          area: 120,
          propertyType: 'apartment',
          listingType: 'sale',
          images: [],
          agentName: 'María López',
          featured: true,
        },
        {
          id: 'rec2',
          title: 'Casa familiar en Santiago',
          location: 'Santiago',
          city: 'Santiago',
          price: 220000,
          bedrooms: 4,
          bathrooms: 3,
          area: 200,
          propertyType: 'house',
          listingType: 'sale',
          images: [],
          agentName: 'Juan Pérez',
        },
        {
          id: 'rec3',
          title: 'Condo frente al mar',
          location: 'Punta Cana',
          city: 'Punta Cana',
          price: 280000,
          bedrooms: 2,
          bathrooms: 2,
          area: 95,
          propertyType: 'condo',
          listingType: 'sale',
          images: [],
          agentName: 'Ana Gómez',
          featured: true,
        },
      ] as Property[]
    }

    // Score and sort
    const scored = properties.map(p => ({
      ...p,
      score: scoreProperty(p, prefs, behavior)
    })).sort((a, b) => b.score - a.score)

    const recommendations = scored.slice(0, 12)

    return NextResponse.json({
      ok: true,
      recommendations,
      preferences: prefs,
      insights: [
        `Encontramos ${recommendations.length} propiedades que coinciden con tus preferencias`,
        `Basado en tu actividad, te recomendamos propiedades en ${prefs.preferredCities.join(', ')}`,
      ]
    })
  } catch (e: any) {
    console.error('recommendations GET error', e)
    return NextResponse.json({ ok: false, error: 'Failed to get recommendations' }, { status: 500 })
  }
}
