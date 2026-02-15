import type { Listing } from '../../types/listing';

export function computeQualityScore(listing: Listing) {
  const photos = Math.min(listing.images?.length || 0, 10) / 10
  const descLen = Math.min((listing.description || '').trim().length, 600) / 600
  const amenities = Math.min((listing.amenities?.length || 0), 8) / 8
  const interiorBonus = (listing.images || []).slice(1).length >= 3 ? 0.05 : 0
  return +(0.55 * photos + 0.30 * descLen + 0.10 * amenities + interiorBonus).toFixed(3)
}

export function computeRecencyScore(listing: Listing) {
  const last = listing.updatedAt ? new Date(listing.updatedAt).getTime() : new Date(listing.createdAt).getTime()
  const hours = Math.max(1, (Date.now() - last) / 3600000)
  const halfLife = 240
  return +Math.exp(-hours / halfLife).toFixed(3)
}

export function computeFinalScore(listing: Listing, agentTrust = 0.5) {
  const q = computeQualityScore(listing)
  const r = computeRecencyScore(listing)
  const agent = Math.max(0, Math.min(agentTrust, 1))
  const featured = listing.featured_until && new Date(listing.featured_until) > new Date() ? 1.25 : 1.0
  const views = listing.views && listing.views > 0 ? Math.min(Math.log(listing.views + 1) / 5, 1) : 0
  const base = 0.33 * r + 0.33 * q + 0.20 * agent + 0.14 * views
  return +(base * featured).toFixed(3)
}
