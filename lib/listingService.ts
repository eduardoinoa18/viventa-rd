import { getAdminDb } from './firebaseAdmin'
import type { Listing, PropertyType, ListingType } from '@/types/listing'
import type { ListingLifecycleStatus } from '@/types/platform'

export interface ListingFilters {
  city?: string
  sector?: string
  propertyType?: PropertyType
  listingType?: ListingType
  agent?: string
  broker?: string
  featured?: boolean
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  status?: ListingLifecycleStatus | 'pending' | 'rented' | 'published' | 'rejected'
}

export interface ListingSearchResult {
  listings: Listing[]
  total: number
}

function normalizeTimestamp(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  return null
}

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

async function resolveUserIdByRole(adminDb: any, role: 'agent' | 'broker', rawValue?: string): Promise<string | null> {
  const value = safeText(rawValue)
  if (!value) return null

  const byId = await adminDb.collection('users').doc(value).get()
  if (byId.exists) {
    const data = byId.data() || {}
    if (safeText(data.role).toLowerCase() === role) return byId.id
  }

  try {
    const bySlug = await adminDb
      .collection('users')
      .where('role', '==', role)
      .where('slug', '==', value.toLowerCase())
      .limit(1)
      .get()
    if (!bySlug.empty) return bySlug.docs[0].id
  } catch {
    // fallback below
  }

  const candidates = await adminDb.collection('users').where('role', '==', role).limit(500).get()
  for (const doc of candidates.docs) {
    const data = doc.data() || {}
    const candidateSlug = safeText(data.slug) || slugify(safeText(data.name || data.displayName || data.company || doc.id))
    if (candidateSlug === value.toLowerCase()) return doc.id
  }

  return null
}

function resolveStatusFilters(status?: ListingFilters['status']): string[] {
  const resolved = String(status || 'active').toLowerCase()
  if (resolved === 'active') return ['active', 'published']
  if (resolved === 'pending' || resolved === 'pending_review') return ['pending_review', 'pending']
  if (resolved === 'sold' || resolved === 'rented') return ['sold', 'rented']
  if (resolved === 'archived' || resolved === 'rejected') return ['archived', 'rejected']
  return [resolved]
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

    let query = adminDb.collection('properties') as any

    // Default to active listings and include legacy published values.
    const statusFilters = resolveStatusFilters(filters.status)
    query = statusFilters.length > 1
      ? query.where('status', 'in', statusFilters)
      : query.where('status', '==', statusFilters[0])

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

    if (filters.featured) {
      query = query.where('featured', '==', true)
    }

    if (filters.agent) {
      const agentId = await resolveUserIdByRole(adminDb, 'agent', filters.agent)
      if (agentId) {
        query = query.where('agentId', '==', agentId)
      }
    }

    // Limit results
    query = query.limit(limit)

    const snapshot = await query.get()

    let listings: Listing[] = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Normalize neighborhood to sector if needed
        sector: doc.get('sector') || doc.get('neighborhood') || '',
        createdAt: normalizeTimestamp(data?.createdAt) || new Date(0),
        updatedAt: normalizeTimestamp(data?.updatedAt) || new Date(0),
      }
    }) as Listing[]

    if (filters.broker) {
      const brokerId = await resolveUserIdByRole(adminDb, 'broker', filters.broker)
      if (brokerId) {
        listings = listings.filter((listing: any) => {
          const direct = safeText((listing as any).brokerId)
          const createdByBroker = safeText((listing as any).createdByBrokerId)
          const brokerageId = safeText((listing as any).brokerageId)
          return direct === brokerId || createdByBroker === brokerId || brokerageId === brokerId
        })
      } else {
        listings = []
      }
    }

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

    const doc = await adminDb.collection('properties').doc(id).get()

    if (!doc.exists) {
      return null
    }

    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: normalizeTimestamp(data?.createdAt) || new Date(0),
      updatedAt: normalizeTimestamp(data?.updatedAt) || new Date(0),
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
      .collection('properties')
      .where('status', 'in', ['active', 'published'])
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
      .collection('properties')
      .where('status', 'in', ['active', 'published'])
      .where('city', '==', city)
      .select('sector', 'neighborhood')
      .get()

    const sectors = new Set<string>()
    snapshot.docs.forEach((doc) => {
      const sector = doc.get('sector') || doc.get('neighborhood')
      if (sector) sectors.add(sector)
    })

    return Array.from(sectors).sort()
  } catch (error) {
    console.error('[getSectorsByCity] Error:', error)
    return []
  }
}
