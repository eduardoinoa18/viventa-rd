// app/api/recommendations/route.ts
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'default-no-store'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, getDocs, query, where, limit, orderBy, Timestamp } from 'firebase/firestore'

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
  try {
    // Fetch from analytics_events to build preferences
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const eventsRef = collection(db, 'analytics_events')
    const q = query(
      eventsRef,
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(ninetyDaysAgo)),
      orderBy('timestamp', 'desc'),
      limit(200)
    )
    
    const snapshot = await getDocs(q)
    const events = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))

    // Analyze events to build preferences
    const locations: { [key: string]: number } = {}
    const bedrooms: { [key: number]: number } = {}
    const prices: number[] = []
    const propertyTypes: { [key: string]: number } = {}

    events.forEach((event: any) => {
      const metadata = event.metadata || {}
      
      if (metadata.location) {
        const loc = metadata.location.toString()
        locations[loc] = (locations[loc] || 0) + (event.eventType === 'favorite_added' ? 3 : 1)
      }
      
      if (metadata.bedrooms && typeof metadata.bedrooms === 'number') {
        bedrooms[metadata.bedrooms] = (bedrooms[metadata.bedrooms] || 0) + 1
      }
      
      if (metadata.price && typeof metadata.price === 'number') {
        prices.push(metadata.price)
      }
      
      if (metadata.propertyType) {
        const type = metadata.propertyType.toString().toLowerCase()
        propertyTypes[type] = (propertyTypes[type] || 0) + 1
      }
    })

    const topLocation = Object.entries(locations).sort(([, a], [, b]) => b - a)[0]
    const topBedrooms = Object.entries(bedrooms).sort(([, a], [, b]) => b - a)[0]
    const topPropertyType = Object.entries(propertyTypes).sort(([, a], [, b]) => b - a)[0]

    prices.sort((a, b) => a - b)
    const medianPrice = prices[Math.floor(prices.length / 2)] || 150000

    return {
      priceMin: medianPrice * 0.7,
      priceMax: medianPrice * 1.5,
      bedrooms: topBedrooms ? parseInt(topBedrooms[0]) : 2,
      propertyType: topPropertyType ? topPropertyType[0] : null,
      preferredCities: topLocation ? [topLocation[0]] : ['Santo Domingo', 'Santiago', 'Punta Cana']
    }
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return {
      priceMin: 50000,
      priceMax: 300000,
      bedrooms: 2,
      propertyType: null,
      preferredCities: ['Santo Domingo', 'Santiago', 'Punta Cana']
    }
  }
}

async function getUserBehavior(userId: string) {
  try {
    // Fetch from analytics_events for behavior patterns
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const eventsRef = collection(db, 'analytics_events')
    const q = query(
      eventsRef,
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('timestamp', 'desc'),
      limit(100)
    )
    
    const snapshot = await getDocs(q)
    const events = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))

    const viewedProperties: string[] = []
    const searchedLocations: string[] = []
    const favoritePropertyTypes: string[] = []

    events.forEach((event: any) => {
      const metadata = event.metadata || {}
      
      if (event.eventType === 'listing_view' && metadata.listingId) {
        viewedProperties.push(metadata.listingId)
      }
      
      if (event.eventType === 'search_performed' && metadata.query) {
        searchedLocations.push(metadata.query)
      }
      
      if (event.eventType === 'favorite_added' && metadata.propertyType) {
        favoritePropertyTypes.push(metadata.propertyType.toString().toLowerCase())
      }
    })

    return {
      viewedProperties: Array.from(new Set(viewedProperties)),
      searchedLocations: Array.from(new Set(searchedLocations)),
      favoritePropertyTypes: Array.from(new Set(favoritePropertyTypes)),
      avgPriceViewed: 150000
    }
  } catch (error) {
    console.error('Error fetching user behavior:', error)
    return {
      viewedProperties: [],
      searchedLocations: ['Santo Domingo'],
      favoritePropertyTypes: ['apartment', 'house'],
      avgPriceViewed: 150000
    }
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

    // Simple per-user cache (5 minutes TTL) and rate limit (30 req / 5 min)
    const now = Date.now()
    const ttlMs = 5 * 60 * 1000
    const maxReq = 30
    const windowMs = 5 * 60 * 1000

    // @ts-ignore - module scoped caches
    ;(globalThis as any).__recCache = (globalThis as any).__recCache || new Map<string, { data: any; expires: number }>()
    // @ts-ignore
    ;(globalThis as any).__recRL = (globalThis as any).__recRL || new Map<string, number[]>()

    const cache: Map<string, { data: any; expires: number }> = (globalThis as any).__recCache
    const rl: Map<string, number[]> = (globalThis as any).__recRL

    // Rate limit sliding window
    const times = rl.get(uid) || []
    const recent = times.filter(t => now - t < windowMs)
    if (recent.length >= maxReq) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 })
    }
    recent.push(now)
    rl.set(uid, recent)

    // Cache hit
    const hit = cache.get(uid)
    if (hit && hit.expires > now) {
      return NextResponse.json(hit.data)
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

    const payload = {
      ok: true,
      recommendations,
      preferences: prefs,
      insights: [
        `Encontramos ${recommendations.length} propiedades que coinciden con tus preferencias`,
        `Basado en tu actividad, te recomendamos propiedades en ${prefs.preferredCities.join(', ')}`,
      ]
    }

    // Save to cache
    cache.set(uid, { data: payload, expires: now + ttlMs })

    return NextResponse.json(payload)
  } catch (e: any) {
    console.error('recommendations GET error', e)
    return NextResponse.json({ ok: false, error: 'Failed to get recommendations' }, { status: 500 })
  }
}
