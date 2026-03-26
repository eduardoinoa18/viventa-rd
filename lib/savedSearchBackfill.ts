/**
 * Backfill recommendation jobs when a new saved search is created.
 * Queries recent active listings and enqueues RecommendationJob documents
 * for any that match the criteria, so the buyer gets immediate value.
 */
import * as crypto from 'crypto'
import { getAdminDb } from '@/lib/firebaseAdmin'
import type { SavedSearchFirestore } from '@/types/platform'

const BACKFILL_LISTING_LIMIT = 100
const MIN_SCORE = 0.01

interface ListingDoc {
  id: string
  [key: string]: unknown
}

function scoreMatch(listing: ListingDoc, criteria: SavedSearchFirestore['criteria']): number {
  let score = 0
  let hardChecks = 0

  if (criteria.city) {
    hardChecks++
    if (String(listing.city || '').toLowerCase() === criteria.city.toLowerCase()) score++
    else return 0
  }
  if (criteria.listingType) {
    hardChecks++
    if (listing.listingType === criteria.listingType) score++
    else return 0
  }
  if (criteria.propertyType) {
    hardChecks++
    if (listing.propertyType === criteria.propertyType) score++
    else return 0
  }
  if (criteria.priceMax) {
    hardChecks++
    if (Number(listing.price || 0) <= criteria.priceMax) score++
    else return 0
  }
  if (criteria.priceMin) {
    hardChecks++
    if (Number(listing.price || 0) >= criteria.priceMin) score++
    else return 0
  }
  if (criteria.bedroomsMin) {
    hardChecks++
    if (Number(listing.bedrooms || 0) >= criteria.bedroomsMin) score++
    else return 0
  }
  if (criteria.bathroomsMin) {
    hardChecks++
    if (Number(listing.bathrooms || 0) >= criteria.bathroomsMin) score++
    else return 0
  }

  if (criteria.sector && String(listing.sector || '').toLowerCase() === criteria.sector.toLowerCase()) {
    score += 0.3
  }

  return hardChecks === 0 ? 0.5 : Math.min(score / hardChecks, 1)
}

function idempotencyKey(userId: string, listingId: string, criteriaHashStr: string, dayBucket: string): string {
  return crypto
    .createHash('sha256')
    .update(`${userId}:${listingId}:${criteriaHashStr}:${dayBucket}`)
    .digest('hex')
    .slice(0, 32)
}

function criteriaHashFn(criteria: SavedSearchFirestore['criteria']): string {
  return crypto.createHash('md5').update(JSON.stringify(criteria)).digest('hex').slice(0, 12)
}

function dayBucket(): string {
  return new Date().toISOString().slice(0, 10)
}

function dispatchWindowMs(frequency: string): number {
  const now = Date.now()
  if (frequency === 'instant') return now + 60 * 1000
  if (frequency === 'daily_digest') {
    const t = new Date()
    t.setDate(t.getDate() + 1)
    t.setHours(8, 0, 0, 0)
    return t.getTime()
  }
  if (frequency === 'weekly_digest') {
    const t = new Date()
    const daysUntilMonday = (8 - t.getDay()) % 7 || 7
    t.setDate(t.getDate() + daysUntilMonday)
    t.setHours(8, 0, 0, 0)
    return t.getTime()
  }
  return now + 60 * 60 * 1000
}

/**
 * Fire-and-forget backfill: enqueue recommendation jobs for recent active
 * listings that match the newly-created saved search criteria.
 * Always resolves — errors are logged, not thrown.
 */
export async function backfillSavedSearchMatches(
  userId: string,
  searchId: string,
  search: SavedSearchFirestore
): Promise<{ jobsEnqueued: number } | null> {
  if (!search.marketingOptIn || search.frequency === 'off' || search.unsubscribed) {
    return null
  }

  const db = getAdminDb()
  if (!db) return null

  try {
    // Fetch recent active listings
    let query = db.collection('listings').where('status', 'in', ['active', 'published'])

    // Apply most selective filter to query, the rest are scored in-app
    if (search.criteria.city) {
      query = query.where('city', '==', search.criteria.city) as typeof query
    }

    const snap = await query.orderBy('createdAt', 'desc').limit(BACKFILL_LISTING_LIMIT).get()
    if (snap.empty) return { jobsEnqueued: 0 }

    const listings: ListingDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))

    const cHash = criteriaHashFn(search.criteria)
    const day = dayBucket()
    const dispatchAfter = dispatchWindowMs(search.frequency)
    let enqueued = 0

    for (const listing of listings) {
      const score = scoreMatch(listing, search.criteria)
      if (score < MIN_SCORE) continue

      const key = idempotencyKey(userId, listing.id, cHash, day)
      const jobRef = db.collection('recommendationJobs').doc(key)
      const existing = await jobRef.get()
      if (existing.exists) continue

      await jobRef.set({
        idempotencyKey: key,
        userId,
        searchId,
        listingId: listing.id,
        score,
        status: 'queued',
        source: 'backfill',
        frequency: search.frequency,
        dispatchAfter,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      enqueued++
    }

    return { jobsEnqueued: enqueued }
  } catch (error) {
    console.error('[savedSearchBackfill] error:', error)
    return null
  }
}
