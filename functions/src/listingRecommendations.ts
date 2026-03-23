/**
 * Listing Recommendation Automation
 * Triggered on Firestore writes to listings/{listingId}.
 * Matches active saved searches to new/updated active listings
 * and enqueues RecommendationJob documents that are dispatched
 * by a separate scheduler.
 */
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as crypto from 'crypto'

type RecommendationFrequency = 'instant' | 'daily_digest' | 'weekly_digest' | 'off'

interface SavedSearchCriteria {
  query?: string
  city?: string
  sector?: string
  listingType?: 'sale' | 'rent'
  propertyType?: string
  priceMin?: number
  priceMax?: number
  currency?: string
  bedroomsMin?: number
  bathroomsMin?: number
  amenitiesAny?: string[]
}

interface SavedSearch {
  id: string
  userId: string
  status: 'active' | 'paused'
  frequency: RecommendationFrequency
  marketingOptIn: boolean
  unsubscribed: boolean
  criteria: SavedSearchCriteria
  lastTriggeredAt?: number
}

const MATCH_SEARCHABLE_FIELDS = [
  'status', 'city', 'listingType', 'propertyType', 'price',
  'bedrooms', 'bathrooms', 'sector',
]

/** Build an idempotency key for a user + listing pair */
function idempotencyKey(userId: string, listingId: string, criteriaHash: string, dayBucket: string): string {
  return crypto
    .createHash('sha256')
    .update(`${userId}:${listingId}:${criteriaHash}:${dayBucket}`)
    .digest('hex')
    .slice(0, 32)
}

function criteriaHash(criteria: SavedSearchCriteria): string {
  return crypto.createHash('md5').update(JSON.stringify(criteria)).digest('hex').slice(0, 12)
}

function dayBucket(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Returns 0–1 relevance score for a listing vs criteria */
function scoreMatch(listing: Record<string, any>, criteria: SavedSearchCriteria): number {
  let score = 0
  let checks = 0

  // Hard filter: must pass all to get any score
  if (criteria.city) {
    checks++
    if (String(listing.city || '').toLowerCase() === criteria.city.toLowerCase()) score++
    else return 0
  }
  if (criteria.listingType) {
    checks++
    if (listing.listingType === criteria.listingType) score++
    else return 0
  }
  if (criteria.propertyType) {
    checks++
    if (listing.propertyType === criteria.propertyType) score++
    else return 0
  }
  if (criteria.priceMax) {
    checks++
    if (Number(listing.price) <= criteria.priceMax) score++
    else return 0
  }
  if (criteria.priceMin) {
    checks++
    if (Number(listing.price) >= criteria.priceMin) score++
    else return 0
  }
  if (criteria.bedroomsMin) {
    checks++
    if (Number(listing.bedrooms) >= criteria.bedroomsMin) score++
    else return 0
  }
  if (criteria.bathroomsMin) {
    checks++
    if (Number(listing.bathrooms) >= criteria.bathroomsMin) score++
    else return 0
  }

  // Soft boosts
  if (criteria.sector && String(listing.sector || '').toLowerCase() === criteria.sector.toLowerCase()) {
    score += 0.3
  }
  if (criteria.amenitiesAny && Array.isArray(listing.features)) {
    const hits = criteria.amenitiesAny.filter((a) => listing.features.includes(a)).length
    score += Math.min(hits * 0.1, 0.5)
  }

  return checks === 0 ? 0.5 : Math.min(score / checks, 1)
}

/** Dispatch window in milliseconds for a given frequency */
function dispatchWindowMs(frequency: RecommendationFrequency): number {
  const now = Date.now()
  if (frequency === 'instant') return now + 60 * 1000                       // 1 min
  if (frequency === 'daily_digest') {
    const tomorrow8am = new Date()
    tomorrow8am.setDate(tomorrow8am.getDate() + 1)
    tomorrow8am.setHours(8, 0, 0, 0)
    return tomorrow8am.getTime()
  }
  if (frequency === 'weekly_digest') {
    const nextMonday8am = new Date()
    const daysUntilMonday = (8 - nextMonday8am.getDay()) % 7 || 7
    nextMonday8am.setDate(nextMonday8am.getDate() + daysUntilMonday)
    nextMonday8am.setHours(8, 0, 0, 0)
    return nextMonday8am.getTime()
  }
  return now + 60 * 60 * 1000 // fallback 1h
}

/**
 * onListingWrite — fires whenever a listing document is created or updated.
 * Only acts on documents whose status just became 'active'.
 */
export const onListingWriteRecommendations = functions.firestore
  .document('listings/{listingId}')
  .onWrite(async (change, context) => {
    const afterData = change.after.data()
    if (!afterData) return null  // deletion — skip

    // Only process when the listing is active
    if (afterData.status !== 'active') return null

    const beforeData = change.before.data()
    const statusChanged = !beforeData || beforeData.status !== 'active'
    const searchableFieldChanged =
      beforeData &&
      MATCH_SEARCHABLE_FIELDS.some((f) => beforeData[f] !== afterData[f])

    if (!statusChanged && !searchableFieldChanged) return null

    const listingId = context.params.listingId
    const db = admin.firestore()

    // Fan-out query: find all active saved searches with opt-in
    // We query in batches to avoid holding too many docs in memory
    const BATCH_SIZE = 200
    let lastDoc: admin.firestore.QueryDocumentSnapshot | null = null
    let processed = 0
    const jobRefs: Promise<any>[] = []

    do {
      let q = db
        .collectionGroup('items')
        .where('status', '==', 'active')
        .where('marketingOptIn', '==', true)
        .where('unsubscribed', '==', false)
        .limit(BATCH_SIZE)

      if (lastDoc) q = q.startAfter(lastDoc)

      const snap = await q.get()
      if (snap.empty) break

      for (const doc of snap.docs) {
        const search = { id: doc.id, ...(doc.data() as Omit<SavedSearch, 'id'>) }
        if (!search.userId) continue
        if (search.frequency === 'off') continue

        const score = scoreMatch(afterData, search.criteria)
        if (score <= 0) continue

        const key = idempotencyKey(
          search.userId,
          listingId,
          criteriaHash(search.criteria),
          dayBucket()
        )

        // Use set with merge:false so duplicate events are no-ops
        const jobRef = db.collection('recommendationJobs').doc(key)
        jobRefs.push(
          jobRef.get().then((existing) => {
            if (existing.exists) return  // idempotent — already enqueued
            return jobRef.set({
              idempotencyKey: key,
              triggerEvent: statusChanged ? 'listing.created' : 'listing.updated',
              listingId,
              savedSearchId: search.id,
              userId: search.userId,
              frequency: search.frequency,
              score,
              status: 'queued',
              dispatchWindowMs: dispatchWindowMs(search.frequency),
              attempt: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            })
          })
        )

        processed++
      }

      lastDoc = snap.docs[snap.docs.length - 1]
      if (snap.docs.length < BATCH_SIZE) break
    } while (true)

    await Promise.allSettled(jobRefs)

    functions.logger.info(`[onListingWriteRecommendations] listing=${listingId} enqueued=${processed}`)
    return null
  })

/**
 * dispatchRecommendationEmails — runs every 15 minutes.
 * Reads queued jobs whose dispatchWindowMs is in the past,
 * sends one consolidated email per user, marks jobs as sent/skipped.
 */
export const dispatchRecommendationEmails = functions.pubsub
  .schedule('every 15 minutes')
  .timeZone('America/Santo_Domingo')
  .onRun(async () => {
    const db = admin.firestore()
    const now = Date.now()
    const DISPATCH_BATCH = 100

    const snap = await db
      .collection('recommendationJobs')
      .where('status', '==', 'queued')
      .where('dispatchWindowMs', '<=', now)
      .limit(DISPATCH_BATCH)
      .get()

    if (snap.empty) return null

    // Group by userId so we can send one email per user
    const byUser = new Map<string, Array<{ jobId: string; listingId: string; score: number }>>()
    snap.docs.forEach((doc) => {
      const data = doc.data()
      if (!data.userId) return
      const arr = byUser.get(data.userId) ?? []
      arr.push({ jobId: doc.id, listingId: data.listingId, score: data.score })
      byUser.set(data.userId, arr)
    })

    const failures: string[] = []

    for (const [userId, jobs] of byUser.entries()) {
      try {
        const userSnap = await db.collection('users').doc(userId).get()
        if (!userSnap.exists) {
          await markJobs(db, jobs.map((j) => j.jobId), 'skipped', 'user_not_found')
          continue
        }

        const user = userSnap.data() as Record<string, any>
        const email = String(user.email || '').trim().toLowerCase()
        if (!email) {
          await markJobs(db, jobs.map((j) => j.jobId), 'skipped', 'no_email')
          continue
        }

        // Fetch listing details for up to 6 matches (sorted by score desc)
        const topJobs = jobs.sort((a, b) => b.score - a.score).slice(0, 6)
        const listingSnaps = await Promise.all(
          topJobs.map((j) => db.collection('listings').doc(j.listingId).get())
        )

        const listings: Array<Record<string, any>> = listingSnaps
          .filter((s) => s.exists && s.data()?.status === 'active')
          .map((s) => ({ id: s.id, ...(s.data() as Record<string, any>) }))

        if (listings.length === 0) {
          await markJobs(db, topJobs.map((j) => j.jobId), 'skipped', 'listings_unavailable')
          continue
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://viventa.com'
        const unsubToken = Buffer.from(`${userId}:ALL`).toString('base64url')
        const unsubUrl = `${baseUrl}/api/saved-searches/unsubscribe?token=${unsubToken}&all=1`

        const cards = listings.map((l) => {
          const location = [l.city, l.sector].filter(Boolean).join(', ')
          const img = l.coverImage || (Array.isArray(l.images) ? l.images[0] : '') || ''
          return `
            <div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:16px;">
              ${img ? `<img src="${img}" alt="${l.title}" style="width:100%;height:180px;object-fit:cover;" />` : ''}
              <div style="padding:16px;">
                <h3 style="margin:0 0 4px;color:#0B2545;font-size:15px;">${l.title || 'Propiedad'}</h3>
                <p style="margin:0 0 8px;color:#6b7280;font-size:12px;">${location}</p>
                <p style="margin:0 0 8px;color:#0B2545;font-weight:700;">$${Number(l.price || 0).toLocaleString()} ${l.currency || 'USD'}</p>
                <p style="margin:0 0 10px;color:#4b5563;font-size:12px;">${l.bedrooms ?? 0} hab · ${l.bathrooms ?? 0} baños · ${l.area ?? 0} m²</p>
                <a href="${baseUrl}/listing/${l.id}" style="background:#00A676;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;">Ver propiedad</a>
              </div>
            </div>
          `
        }).join('')

        const buyerName = String(user.name || user.displayName || 'Estimado cliente')
        const html = `
          <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#0B2545 0%,#00A676 100%);padding:24px;border-radius:12px 12px 0 0;color:#fff;">
              <h1 style="margin:0;font-size:22px;">Propiedades que coinciden con tu búsqueda</h1>
              <p style="margin:8px 0 0;opacity:.9;font-size:14px;">Recomendaciones personalizadas de Viventa</p>
            </div>
            <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
              <p style="margin:0 0 16px;color:#111827;">Hola ${buyerName},</p>
              <p style="margin:0 0 20px;color:#374151;">Encontramos ${listings.length} propiedad${listings.length > 1 ? 'es' : ''} que puede${listings.length > 1 ? 'n' : ''} interesarte.</p>
              ${cards}
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;" />
              <p style="color:#9ca3af;font-size:11px;margin:0;">
                Recibes este correo porque guardaste una búsqueda en Viventa.
                <a href="${unsubUrl}" style="color:#6b7280;">Cancelar suscripción</a>
              </p>
            </div>
          </div>
        `

        // Use dynamic import to avoid bundling next.js email service in functions
        const sgMail = await import('@sendgrid/mail')
        if (process.env.SENDGRID_API_KEY) {
          sgMail.default.setApiKey(process.env.SENDGRID_API_KEY)
          await sgMail.default.send({
            to: email,
            from: `VIVENTA <${process.env.SENDGRID_FROM_EMAIL || 'noreply@viventa.com'}>`,
            subject: `${listings.length} propiedad${listings.length > 1 ? 'es nuevas' : ' nueva'} para ti · Viventa`,
            html,
          })
        }

        await markJobs(db, topJobs.map((j) => j.jobId), 'sent')

        // Log recommendation email event
        await db.collection('email_events').add({
          provider: 'sendgrid',
          eventType: 'recommendation_sent',
          to: email,
          userId,
          listingIds: listings.map((l) => l.id),
          createdAt: new Date(),
        })

      } catch (err: any) {
        functions.logger.error(`[dispatchRecommendationEmails] user=${userId}`, err)
        failures.push(userId)
        await markJobs(db, jobs.map((j) => j.jobId), 'failed', String(err?.message || 'unknown'))
      }
    }

    functions.logger.info(`[dispatchRecommendationEmails] processed=${byUser.size} failures=${failures.length}`)
    return null
  })

async function markJobs(
  db: admin.firestore.Firestore,
  jobIds: string[],
  status: 'sent' | 'skipped' | 'failed',
  reason?: string
): Promise<void> {
  const batch = db.batch()
  jobIds.forEach((id) => {
    batch.update(db.collection('recommendationJobs').doc(id), {
      status,
      skipReason: reason ?? null,
      updatedAt: Date.now(),
    })
  })
  await batch.commit()
}
