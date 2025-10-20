import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import algoliasearch from 'algoliasearch'
import { computeFinalScore } from './searchIndexUtils'
export { acceptInvite } from './acceptInvite'
export { logAdminAction } from './auditLog'
export { sendAdminCode, verifyAdminCode } from './adminAuth'
export { processApplication } from './applications'

admin.initializeApp()

const appId = process.env.ALGOLIA_APP_ID || functions.config().algolia?.app_id
const apiKey = process.env.ALGOLIA_ADMIN_KEY || functions.config().algolia?.api_key
const indexName = process.env.ALGOLIA_INDEX || functions.config().algolia?.index || 'viventa_listings_dev'

const client = algoliasearch(appId || '', apiKey || '')
const index = client.initIndex(indexName)

function toIndexObject(id: string, data: FirebaseFirestore.DocumentData) {
  const listing: any = { ...data, id }
  listing._geoloc = { lat: listing.lat, lng: listing.lng }
  listing.score = computeFinalScore(listing, (data.agentTrust ?? 0.5) as number)
  return { objectID: id, ...listing }
}

export const onListingCreate = functions.firestore
  .document('listings/{id}')
  .onCreate(async (snap) => {
    const data = snap.data()
    try {
      await index.saveObject(toIndexObject(snap.id, data))
      functions.logger.info('Indexed listing create', { id: snap.id })
    } catch (err) {
      functions.logger.error('Index create failed', { id: snap.id, err })
      await admin.firestore().collection('index_sync_errors').doc(snap.id).set({
        type: 'create', payload: data, error: String(err), ts: admin.firestore.FieldValue.serverTimestamp(),
      })
    }
  })

export const onListingUpdate = functions.firestore
  .document('listings/{id}')
  .onUpdate(async (change) => {
    const data = change.after.data()
    try {
      await index.saveObject(toIndexObject(change.after.id, data))
      functions.logger.info('Indexed listing update', { id: change.after.id })
    } catch (err) {
      functions.logger.error('Index update failed', { id: change.after.id, err })
      await admin.firestore().collection('index_sync_errors').doc(change.after.id).set({
        type: 'update', payload: data, error: String(err), ts: admin.firestore.FieldValue.serverTimestamp(),
      })
    }
  })

export const onListingDelete = functions.firestore
  .document('listings/{id}')
  .onDelete(async (snap) => {
    try {
      await index.deleteObject(snap.id)
      functions.logger.info('Indexed listing delete', { id: snap.id })
    } catch (err) {
      functions.logger.error('Index delete failed', { id: snap.id, err })
      await admin.firestore().collection('index_sync_errors').doc(snap.id).set({
        type: 'delete', payload: null, error: String(err), ts: admin.firestore.FieldValue.serverTimestamp(),
      })
    }
  })

export const reindexAllListings = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('permission-denied', 'Auth required')
  }
  const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get()
  const role = userDoc.get('role')
  if (!['brokerage_admin','master_admin'].includes(role)) {
    throw new functions.https.HttpsError('permission-denied', 'Admin required')
  }
  const BATCH = 500
  let last: FirebaseFirestore.DocumentSnapshot | null = null
  let total = 0
  for (;;) {
    let q = admin.firestore().collection('listings').orderBy('createdAt').limit(BATCH)
    if (last) q = q.startAfter(last)
    const snap = await q.get()
    if (snap.empty) break
    const objects = snap.docs.map((d) => toIndexObject(d.id, d.data()))
    await index.saveObjects(objects)
    total += objects.length
    last = snap.docs[snap.docs.length - 1]
  }
  return { ok: true, total }
})
