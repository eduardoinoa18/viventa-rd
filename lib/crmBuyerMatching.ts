import type { SavedSearchFirestore } from '@/types/platform'
import type { firestore } from 'firebase-admin'

export interface BuyerMatchListing {
  id: string
  title: string
  city: string
  sector: string
  image: string
  price: number
  bedrooms: number
  bathrooms: number
  squareMeters: number
  pricePerM2: number
  verified: boolean
}

export function normalizeBuyerCriteria(raw: Record<string, any>): SavedSearchFirestore['criteria'] {
  return {
    query: typeof raw.query === 'string' ? raw.query : undefined,
    city: typeof raw.city === 'string' ? raw.city : typeof raw.location === 'string' ? raw.location : undefined,
    sector: typeof raw.sector === 'string' ? raw.sector : undefined,
    listingType: raw.listingType === 'sale' || raw.listingType === 'rent' ? raw.listingType : undefined,
    propertyType: typeof raw.propertyType === 'string' ? raw.propertyType : undefined,
    priceMin: Number.isFinite(Number(raw.priceMin)) ? Number(raw.priceMin) : Number.isFinite(Number(raw.budgetMin)) ? Number(raw.budgetMin) : undefined,
    priceMax: Number.isFinite(Number(raw.priceMax)) ? Number(raw.priceMax) : Number.isFinite(Number(raw.budgetMax)) ? Number(raw.budgetMax) : undefined,
    bedroomsMin: Number.isFinite(Number(raw.bedroomsMin)) ? Number(raw.bedroomsMin) : Number.isFinite(Number(raw.bedrooms)) ? Number(raw.bedrooms) : undefined,
    bathroomsMin: Number.isFinite(Number(raw.bathroomsMin)) ? Number(raw.bathroomsMin) : Number.isFinite(Number(raw.bathrooms)) ? Number(raw.bathrooms) : undefined,
    currency: raw.currency === 'USD' || raw.currency === 'DOP' ? raw.currency : undefined,
  }
}

function mapListing(doc: firestore.QueryDocumentSnapshot): BuyerMatchListing {
  const data = doc.data() as Record<string, any>
  const squareMeters = Number(data.squareMeters ?? data.area ?? 0)
  const price = Number(data.price || 0)
  const pricePerM2 = squareMeters > 0 ? Math.round(price / squareMeters) : 0

  return {
    id: doc.id,
    title: String(data.title || 'Listing'),
    city: String(data.city || ''),
    sector: String(data.sector || ''),
    image: Array.isArray(data.images) && data.images[0] ? String(data.images[0]) : String(data.coverImage || ''),
    price,
    bedrooms: Number(data.bedrooms || 0),
    bathrooms: Number(data.bathrooms || 0),
    squareMeters,
    pricePerM2,
    verified: Boolean(data.verified),
  }
}

function buildMatchQuery(
  adminDb: firestore.Firestore,
  criteria: SavedSearchFirestore['criteria']
): firestore.Query {
  let ref: firestore.Query = adminDb.collection('listings').where('status', 'in', ['active', 'published'])

  if (criteria.city) ref = ref.where('city', '==', criteria.city)
  if (criteria.sector) ref = ref.where('sector', '==', criteria.sector)
  if (criteria.listingType) ref = ref.where('listingType', '==', criteria.listingType)
  if (criteria.propertyType) ref = ref.where('propertyType', '==', criteria.propertyType)
  if (criteria.priceMin !== undefined) ref = ref.where('price', '>=', criteria.priceMin)
  if (criteria.priceMax !== undefined) ref = ref.where('price', '<=', criteria.priceMax)
  if (criteria.bedroomsMin !== undefined) ref = ref.where('bedrooms', '>=', criteria.bedroomsMin)
  if (criteria.bathroomsMin !== undefined) ref = ref.where('bathrooms', '>=', criteria.bathroomsMin)

  return ref
}

export async function getBuyerMatches(
  adminDb: firestore.Firestore,
  criteria: SavedSearchFirestore['criteria'],
  limit: number
): Promise<{ listings: BuyerMatchListing[]; warning?: string }> {
  try {
    const query = buildMatchQuery(adminDb, criteria)
    const snap = await query.limit(limit).get()
    return { listings: snap.docs.map(mapListing) }
  } catch {
    // Fallback avoids hard failure when a composite index is missing.
    const fallback = await adminDb
      .collection('listings')
      .where('status', 'in', ['active', 'published'])
      .limit(limit)
      .get()

    return {
      listings: fallback.docs.map(mapListing),
      warning: 'Some criteria filters were skipped because an index is not available yet',
    }
  }
}
