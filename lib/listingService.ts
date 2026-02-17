import { getAdminDb } from './firebaseAdmin'
import type { Listing, PropertyType, ListingType } from '@/types/listing'

export interface ListingFilters {
  city?: string
  sector?: string
  propertyType?: PropertyType
  listingType?: ListingType
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  status?: 'active' | 'draft' | 'pending' | 'sold' | 'rented'
}

export interface ListingSearchResult {
  listings: Listing[]
  total: number
}

/**
 * Fetch listings from Firestore (server-side only)
 * Used for SSR pages: /search, /ciudad/[city], etc.
 */
export async function getListings(
  filters: ListingFilters = {},
  limit: number = 50
): Promise<ListingSearchResult> {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) {
      console.error('[getListings] Admin DB not initialized')
      return { listings: [], total: 0 }
    }

    let query = adminDb.collection('listings') as any

    // Default to active listings only
    const status = filters.status || 'active'
    query = query.where('status', '==', status)

    // Apply filters
    if (filters.city) {
      query = query.where('city', '==', filters.city)
    }

    if (filters.sector) {
      query = query.where('sector', '==', filters.sector)
    }

    if (filters.propertyType) {
      query = query.where('propertyType', '==', filters.propertyType)
    }

    if (filters.listingType) {
      query = query.where('listingType', '==', filters.listingType)
    }

    // Limit results
    query = query.limit(limit)

    const snapshot = await query.get()

    let listings: Listing[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as Listing[]

    // Client-side filters for price and bedrooms (Firestore composite index limitation)
    if (filters.minPrice) {
      listings = listings.filter((l) => (l.price || 0) >= filters.minPrice!)
    }

    if (filters.maxPrice) {
      listings = listings.filter((l) => (l.price || 0) <= filters.maxPrice!)
    }

    if (filters.bedrooms) {
      listings = listings.filter((l) => (l.bedrooms || 0) >= filters.bedrooms!)
    }

    if (filters.bathrooms) {
      listings = listings.filter((l) => (l.bathrooms || 0) >= filters.bathrooms!)
    }

    return {
      listings,
      total: listings.length,
    }
  } catch (error) {
    console.error('[getListings] Error:', error)
    return {
      listings: [],
      total: 0,
    }
  }
}

/**
 * Get a single listing by ID (server-side)
 */
export async function getListingById(id: string): Promise<Listing | null> {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) {
      console.error('[getListingById] Admin DB not initialized')
      return null
    }

    const doc = await adminDb.collection('listings').doc(id).get()

    if (!doc.exists) {
      return null
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Listing
  } catch (error) {
    console.error('[getListingById] Error:', error)
    return null
  }
}

/**
 * Get all unique cities with active listings
 */
export async function getActiveCities(): Promise<string[]> {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) {
      console.error('[getActiveCities] Admin DB not initialized')
      return []
    }

    const snapshot = await adminDb
      .collection('listings')
      .where('status', '==', 'active')
      .select('city')
      .get()

    const cities = new Set<string>()
    snapshot.docs.forEach((doc) => {
      const city = doc.get('city')
      if (city) cities.add(city)
    })

    return Array.from(cities).sort()
  } catch (error) {
    console.error('[getActiveCities] Error:', error)
    return []
  }
}

/**
 * Get all unique sectors for a city
 */
export async function getSectorsByCity(city: string): Promise<string[]> {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) {
      console.error('[getSectorsByCity] Admin DB not initialized')
      return []
    }

    const snapshot = await adminDb
      .collection('listings')
      .where('status', '==', 'active')
      .where('city', '==', city)
      .select('sector')
      .get()

    const sectors = new Set<string>()
    snapshot.docs.forEach((doc) => {
      const sector = doc.get('sector')
      if (sector) sectors.add(sector)
    })

    return Array.from(sectors).sort()
  } catch (error) {
    console.error('[getSectorsByCity] Error:', error)
    return []
  }
}
