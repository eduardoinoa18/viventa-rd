/**
 * Saved Search Firestore service (server-side, Admin SDK only)
 * Handles CRUD for savedSearches/{userId}/items/{searchId}
 */
import type { SavedSearchFirestore, RecommendationFrequency } from '@/types/platform'
import { getAdminDb } from '@/lib/firebaseAdmin'

const MAX_PER_USER = 25

function col(userId: string) {
  const db = getAdminDb()
  if (!db) throw new Error('Firestore Admin not initialized')
  return db.collection('savedSearches').doc(userId).collection('items')
}

function now(): number {
  return Date.now()
}

export async function listSavedSearches(userId: string): Promise<SavedSearchFirestore[]> {
  const snap = await col(userId).orderBy('createdAt', 'desc').limit(MAX_PER_USER).get()
  return snap.docs.map((d) => ({ ...(d.data() as SavedSearchFirestore), id: d.id }))
}

export async function createSavedSearch(
  userId: string,
  input: {
    label: string
    criteria: SavedSearchFirestore['criteria']
    frequency?: RecommendationFrequency
    marketingOptIn?: boolean
    locale?: string
  }
): Promise<SavedSearchFirestore> {
  const existing = await col(userId).count().get()
  if (existing.data().count >= MAX_PER_USER) {
    throw new Error(`Maximum ${MAX_PER_USER} saved searches per user`)
  }

  const ts = now()
  const data: Omit<SavedSearchFirestore, 'id'> = {
    userId,
    label: input.label.trim() || 'Búsqueda guardada',
    status: 'active',
    locale: input.locale || 'es-DO',
    frequency: input.frequency ?? 'daily_digest',
    marketingOptIn: input.marketingOptIn ?? false,
    unsubscribed: false,
    unsubscribedAt: null,
    criteria: input.criteria,
    lastTriggeredAt: 0,
    createdAt: ts,
    updatedAt: ts,
  }

  const ref = await col(userId).add(data)
  return { ...data, id: ref.id }
}

export async function updateSavedSearch(
  userId: string,
  searchId: string,
  patch: Partial<Pick<SavedSearchFirestore, 'label' | 'criteria' | 'frequency' | 'marketingOptIn' | 'status'>>
): Promise<void> {
  await col(userId).doc(searchId).update({ ...patch, updatedAt: now() })
}

export async function deleteSavedSearch(userId: string, searchId: string): Promise<void> {
  await col(userId).doc(searchId).delete()
}

export async function unsubscribeSavedSearch(userId: string, searchId: string): Promise<void> {
  await col(userId).doc(searchId).update({
    unsubscribed: true,
    unsubscribedAt: now(),
    frequency: 'off',
    updatedAt: now(),
  })
}

export async function unsubscribeAllForUser(userId: string): Promise<void> {
  const db = getAdminDb()
  if (!db) throw new Error('Firestore Admin not initialized')
  const snap = await col(userId).where('unsubscribed', '==', false).get()
  const batch = db.batch()
  snap.docs.forEach((d) =>
    batch.update(d.ref, { unsubscribed: true, unsubscribedAt: now(), frequency: 'off', updatedAt: now() })
  )
  await batch.commit()
}
